import React, { FC, useCallback } from 'react';
import { Menu } from 'react-elegant-ui/esm/components/Menu/Menu.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INote, NoteId } from '../../../../core/Note';
import { INotesRegistry } from '../../../../core/Registry';

import { getNoteTitle } from '../..';
import { NoteContextMenuCallback, useNoteContextMenu } from './hooks/useNoteContextMenu';
import { NoteActions } from './NoteContextMenu';

import './NotesList.css';

export const cnNotesList = cn('NotesList');

export type NotesListProps = {
	notes: INote[];
	onPick: (id: NoteId) => void;
	closeNote: (id: NoteId) => void;
	updateNotes: () => void;

	// TODO: receive with react context
	notesRegistry: INotesRegistry;

	openedNotes?: NoteId[];
	activeNote?: NoteId | null;
};

export const NotesList: FC<NotesListProps> = ({
	notes,
	onPick,
	closeNote,
	updateNotes,
	notesRegistry,
	openedNotes,
	activeNote,
}) => {
	const noteContextMenuCallback: NoteContextMenuCallback = useCallback(
		async ({ noteId, action }) => {
			switch (action) {
				case NoteActions.DELETE:
					const isConfirmed = confirm('Are you sure to delete note?');
					if (!isConfirmed) return;

					closeNote(noteId);
					await notesRegistry.delete([noteId]);
					updateNotes();
					break;
				case NoteActions.DUPLICATE:
					const note = await notesRegistry.getById(noteId);

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

	const openNoteContextMenu = useNoteContextMenu(noteContextMenuCallback);

	// TODO: implement dragging and moving items
	return (
		<Menu
			className={cnNotesList()}
			onPick={onPick}
			items={notes.map((note) => {
				return {
					id: note.id,
					textContent: getNoteTitle(note.data),
					content: (
						<div
							onContextMenu={(evt) => {
								openNoteContextMenu(note.id, {
									x: evt.pageX,
									y: evt.pageY,
								});
							}}
						>
							{getNoteTitle(note.data)}
						</div>
					),
					addonProps: {
						className: cnNotesList('Item', {
							active: note.id === activeNote,
							opened: openedNotes && openedNotes.indexOf(note.id) !== -1,
						}),
					},
				};
			})}
		/>
	);
};
