import { useCallback } from 'react';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { stringify as stringifyYaml } from 'yaml';

import { formatNoteLink, getAppResourceDataInUrl } from '../../../../../core/links';
import { NoteId } from '../../../../../core/Note';
import { INotesRegistry } from '../../../../../core/Registry';
import { FilesRegistry } from '../../../../../core/Registry/FilesRegistry/FilesRegistry';
import { tagAttachmentsChanged } from '../../../../../core/state/tags';
import { ContextMenu } from '../../../../../electron/contextMenu';
import { selectDirectory } from '../../../../../electron/requests/files/renderer';
import { copyTextToClipboard } from '../../../../../utils/clipboard';
import {
	ContextMenuCallback,
	useContextMenu,
} from '../../../../components/hooks/useContextMenu';
import { useFilesRegistry, useTagsRegistry } from '../../../Providers';
import { replaceUrls } from '../../StatusBar/buttons/useImportNotes';

import { mkdir, writeFile } from 'fs/promises';
import { NoteActions } from '.';

type DefaultContextMenuOptions = {
	closeNote: (id: NoteId) => void;
	updateNotes: () => void;

	// TODO: receive with react context
	notesRegistry: INotesRegistry;
};

export const noteMenu: ContextMenu = [
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

type SaveFileCallback = (file: File, id: string) => Promise<string>;
type FileUploader = (id: string) => Promise<string | null>;

class NotesExporter {
	private readonly saveFile: SaveFileCallback;
	private readonly notesRegistry: INotesRegistry;
	private readonly filesRegistry: FilesRegistry;
	constructor({
		saveFile,
		notesRegistry,
		filesRegistry,
	}: {
		saveFile: SaveFileCallback;
		notesRegistry: INotesRegistry;
		filesRegistry: FilesRegistry;
	}) {
		this.saveFile = saveFile;
		this.notesRegistry = notesRegistry;
		this.filesRegistry = filesRegistry;
	}

	private createFileUploader() {
		const fetchedFiles: Record<string, string | null> = {};
		return async (id: string) => {
			// Fetch file and upload
			if (!(id in fetchedFiles)) {
				const file = await this.filesRegistry.get(id);
				fetchedFiles[id] = file ? await this.saveFile(file, id) : null;
			}

			return fetchedFiles[id];
		};
	}

	private async exportSingleNote(noteId: string, getUploadedFilePath: FileUploader) {
		const note = await this.notesRegistry.getById(noteId);
		if (!note) return;

		const markdownProcessor = unified()
			.use(remarkParse)
			.use(remarkParseFrontmatter)
			.use(remarkFrontmatter, ['yaml', 'toml'])
			.use(remarkGfm)
			.use(remarkStringify, { bullet: '-', listItemIndent: 'one' })
			.freeze();

		const mdTree = markdownProcessor.parse(note.data.text);

		// TODO: add tags
		mdTree.children.unshift({
			type: 'yaml',
			value: stringifyYaml({
				title: note.data.title,
				created: note.createdTimestamp,
				updated: note.updatedTimestamp,
			}),
		});

		await replaceUrls(
			mdTree,
			async (nodeUrl) => {
				const appResource = getAppResourceDataInUrl(nodeUrl);

				if (!appResource) return nodeUrl;
				if (appResource.type === 'note') return `./${appResource.id}.md`;

				const filePath = await getUploadedFilePath(appResource.id);
				return filePath ?? nodeUrl;
			},
			true,
		);

		return markdownProcessor.stringify(mdTree);
	}

	public async exportNote(noteId: string) {
		return this.exportSingleNote(noteId, this.createFileUploader());
	}

	public async exportNotes() {
		const notes = await this.notesRegistry.get();
		const uploader = this.createFileUploader();

		return Promise.all(notes.map((note) => this.exportSingleNote(note.id, uploader)));
	}
}

export const useDefaultNoteContextMenu = ({
	closeNote,
	updateNotes,
	notesRegistry,
}: DefaultContextMenuOptions) => {
	const filesRegistry = useFilesRegistry();
	const tagsRegistry = useTagsRegistry();

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
					const directories = await selectDirectory();
					if (!directories || directories.length !== 1) {
						console.log('Must be selected one directory');
						return;
					}

					const directory = directories[0];
					const filesDirectoryName = `_files`;
					const filesDirectory = [directory, filesDirectoryName].join('/');

					// TODO: remove node usages in frontend code
					await mkdir(filesDirectory, { recursive: true });

					const notesExport = new NotesExporter({
						saveFile: async (file, id) => {
							const filename = `${filesDirectory}/${id}-${file.name}`;

							const buffer = await file.arrayBuffer();
							await writeFile(filename, new Uint8Array(buffer));
							return `./${filesDirectoryName}/${id}-${file.name}`;
						},
						notesRegistry,
						filesRegistry,
					});

					const noteData = await notesExport.exportNote(id);

					if (!noteData) return;

					await writeFile(`${directory}/${id}.md`, noteData);
					break;
				}
			}
		},
		[closeNote, filesRegistry, notesRegistry, tagsRegistry, updateNotes],
	);

	return useContextMenu(noteMenu, noteContextMenuCallback);
};
