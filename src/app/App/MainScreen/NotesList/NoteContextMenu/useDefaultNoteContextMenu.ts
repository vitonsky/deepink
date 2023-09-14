import { useCallback } from "react";

import { NoteId } from "../../../../../core/Note";
import { INotesRegistry } from "../../../../../core/Registry";
import { tagAttachmentsChanged } from "../../../../../core/state/tags";
import { ContextMenu } from "../../../../../electron/contextMenu";
import { ContextMenuCallback, useContextMenu } from "../../../../components/hooks/useContextMenu";
import { useTagsRegistry } from "../../../Providers";

import { NoteActions } from ".";

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
	{ type: 'separator' },
	{
		id: NoteActions.DELETE,
		label: 'Delete',
	},
];

export const useDefaultNoteContextMenu = ({ closeNote, updateNotes, notesRegistry }: DefaultContextMenuOptions) => {
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
					attachedTags.forEach(({ id: tagId }) => tagAttachmentsChanged([{
						tagId,
						target: id,
						state: 'delete'
					}]));

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
					const newNoteId = await notesRegistry.add({ title: 'DUPLICATE: ' + title, text });

					const attachedTags = await tagsRegistry.getAttachedTags(id);
					const attachedTagsIds = attachedTags.map(({ id }) => id);

					await tagsRegistry.setAttachedTags(newNoteId, attachedTagsIds);
					tagAttachmentsChanged(attachedTagsIds.map((tagId) => ({
						tagId,
						target: newNoteId,
						state: 'add'
					})));

					updateNotes();
					break;
				}
			}
		},
		[closeNote, notesRegistry, tagsRegistry, updateNotes],
	);

	return useContextMenu(noteMenu, noteContextMenuCallback);
};
