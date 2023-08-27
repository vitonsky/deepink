import { useCallback } from "react";

import { NoteId } from "../../../../../core/Note";
import { INotesRegistry } from "../../../../../core/Registry";
import { ContextMenu } from "../../../../../electron/contextMenu";
import { ContextMenuCallback, useContextMenu } from "../../../../components/hooks/useContextMenu";

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
	const noteContextMenuCallback: ContextMenuCallback<NoteActions> = useCallback(
		async ({ id, action }) => {
			switch (action) {
				case NoteActions.DELETE:
					const isConfirmed = confirm('Are you sure to delete note?');
					if (!isConfirmed) return;

					closeNote(id);
					await notesRegistry.delete([id]);
					updateNotes();
					break;
				case NoteActions.DUPLICATE:
					const note = await notesRegistry.getById(id);

					if (!note) {
						console.warn(`Not found note with id ${note}`);
						return;
					}

					const { title, text } = note.data;
					await notesRegistry.add({ title: 'DUPLICATE: ' + title, text });
					updateNotes();
					break;
			}
		},
		[closeNote, notesRegistry, updateNotes],
	);

	return useContextMenu(noteMenu, noteContextMenuCallback);
};
