import { useCallback } from 'react';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

import { formatNoteLink, getAppResourceDataInUrl } from '../../../../../core/links';
import { NoteId } from '../../../../../core/Note';
import { INotesRegistry } from '../../../../../core/Registry';
import { tagAttachmentsChanged } from '../../../../../core/state/tags';
import { ContextMenu } from '../../../../../electron/contextMenu';
import { copyTextToClipboard } from '../../../../../utils/clipboard';
import {
	ContextMenuCallback,
	useContextMenu,
} from '../../../../components/hooks/useContextMenu';
import {
	useAttachmentsRegistry,
	useFilesRegistry,
	useTagsRegistry,
} from '../../../Providers';
import { replaceUrls } from '../../StatusBar/buttons/useImportNotes';

import { NoteActions } from '.';

type DefaultContextMenuOptions = {
	closeNote: (id: NoteId) => void;
	updateNotes: () => void;

	// TODO: receive with react context
	notesRegistry: INotesRegistry;
};

export const noteMenu: ContextMenu = [
	// TODO: implement
	// {
	// 	id: 'copyMarkdownLink',
	// 	label: 'Copy Markdown link',
	// },
	{
		id: NoteActions.DUPLICATE,
		label: 'Duplicate',
	},
	{
		id: NoteActions.COPY_MARKDOWN_LINK,
		label: 'Copy markdown link',
	},
	{
		id: NoteActions.EXPORT,
		label: 'Export',
	},
	{ type: 'separator' },
	{
		id: NoteActions.DELETE,
		label: 'Delete',
	},
];

const mdCharsForEscape = ['\\', '[', ']'];
const mdCharsForEscapeRegEx = new RegExp(
	`(${mdCharsForEscape.map((char) => '\\' + char).join('|')})`,
	'g',
);

export const useDefaultNoteContextMenu = ({
	closeNote,
	updateNotes,
	notesRegistry,
}: DefaultContextMenuOptions) => {
	const tagsRegistry = useTagsRegistry();
	const attachments = useAttachmentsRegistry();
	const files = useFilesRegistry();
	const noteContextMenuCallback: ContextMenuCallback<NoteActions> = useCallback(
		async ({ id, action }) => {
			switch (action) {
				case NoteActions.DELETE: {
					const isConfirmed = confirm('Are you sure to delete note?');
					if (!isConfirmed) return;

					closeNote(id);
					await notesRegistry.delete([id]);

					const attachedTags = await tagsRegistry.getAttachedTags(id);
					await tagsRegistry.setAttachedTags(id, []);
					attachedTags.forEach(({ id: tagId }) =>
						tagAttachmentsChanged([
							{
								tagId,
								target: id,
								state: 'delete',
							},
						]),
					);

					updateNotes();
					break;
				}
				case NoteActions.DUPLICATE: {
					const sourceNote = await notesRegistry.getById(id);

					if (!sourceNote) {
						console.warn(`Not found note with id ${sourceNote}`);
						return;
					}

					const { title, text } = sourceNote.data;
					const newNoteId = await notesRegistry.add({
						title: 'DUPLICATE: ' + title,
						text,
					});

					const attachedTags = await tagsRegistry.getAttachedTags(id);
					const attachedTagsIds = attachedTags.map(({ id }) => id);

					await tagsRegistry.setAttachedTags(newNoteId, attachedTagsIds);
					tagAttachmentsChanged(
						attachedTagsIds.map((tagId) => ({
							tagId,
							target: newNoteId,
							state: 'add',
						})),
					);

					updateNotes();
					break;
				}
				case NoteActions.COPY_MARKDOWN_LINK: {
					const note = await notesRegistry.getById(id);
					if (!note) {
						console.error(`Can't get data of note #${id}`);
						return;
					}

					const { title, text } = note.data;
					const noteTitle = (title || text.slice(0, 30))
						.trim()
						.replace(mdCharsForEscapeRegEx, '\\$1');
					const markdownLink = `[${noteTitle}](${formatNoteLink(id)})`;

					console.log(`Copy markdown link ${markdownLink}`);

					copyTextToClipboard(markdownLink);
					break;
				}
				case NoteActions.EXPORT: {
					const note = await notesRegistry.getById(id);
					if (!note) return;

					const attachedFiles = await attachments
						.get(note.id)
						.then(async (ids) => {
							const filesList: File[] = [];
							for (const id of ids) {
								const file = await files.get(id);
								if (!file) continue;

								filesList.push(file);
							}

							return filesList;
						});

					const fetchedFiles: Record<string, File | null> = {};
					const getUploadedFilePath = async (id: string) => {
						// Fetch file and upload
						if (!(id in fetchedFiles)) {
							const file = await files.get(id);
							fetchedFiles[id] = file;

							// TODO: save file to special directory
						}

						if (!fetchedFiles[id]) return null;

						return `/foo/bar/baz/${id}`;
					};

					const markdownProcessor = unified()
						.use(remarkParse)
						.use(remarkParseFrontmatter)
						.use(remarkFrontmatter, ['yaml', 'toml'])
						.use(remarkGfm)
						.use(remarkStringify, { bullet: '-', listItemIndent: 'one' })
						.freeze();

					const mdTree = markdownProcessor.parse(note.data.text);

					await replaceUrls(
						mdTree,
						async (nodeUrl) => {
							const appResource = getAppResourceDataInUrl(nodeUrl);

							// TODO: handle links on another notes
							if (!appResource || appResource.type !== 'resource')
								return nodeUrl;

							const filePath = await getUploadedFilePath(appResource.id);
							return filePath ?? nodeUrl;
						},
						true,
					);

					// TODO: save file
					console.log('Export', {
						attachedFiles,
						text: markdownProcessor.stringify(mdTree),
					});
					break;
				}
			}
		},
		[attachments, closeNote, files, notesRegistry, tagsRegistry, updateNotes],
	);

	return useContextMenu(noteMenu, noteContextMenuCallback);
};
