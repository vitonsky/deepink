import { useCallback } from 'react';

import { formatNoteLink } from '../../../../../core/links';
import { NoteId } from '../../../../../core/Note';
import { INotesRegistry } from '../../../../../core/Registry';
import { tagAttachmentsChanged } from '../../../../../core/state/tags';
import { ContextMenu } from '../../../../../electron/contextMenu';
import { copyTextToClipboard } from '../../../../../utils/clipboard';
import {
	ContextMenuCallback,
	useContextMenu,
} from '../../../../components/hooks/useContextMenu';
import { useTagsRegistry } from '../../../Providers';

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
			}
		},
		[closeNote, notesRegistry, tagsRegistry, updateNotes],
	);

	return useContextMenu(noteMenu, noteContextMenuCallback);
};
