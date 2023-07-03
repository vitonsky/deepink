import React, { FC } from 'react';
import { Menu } from 'react-elegant-ui/esm/components/Menu/Menu.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INote, NoteId } from '../../../../core/Note';
import { INotesRegistry } from '../../../../core/Registry';

import { getNoteTitle } from '../..';
import { useDefaultNoteContextMenu } from './NoteContextMenu/useDefaultNoteContextMenu';

import './NotesList.css';

export const cnNotesList = cn('NotesList');

export type NotesListProps = {
	notes: INote[];
	onPick: (id: NoteId) => void;
	onClose: (id: NoteId) => void;
	updateNotes: () => void;

	// TODO: receive with react context
	notesRegistry: INotesRegistry;

	openedNotes?: NoteId[];
	activeNote?: NoteId | null;
};

export const NotesList: FC<NotesListProps> = ({
	notes,
	onPick,
	onClose,
	updateNotes,
	notesRegistry,
	openedNotes,
	activeNote,
}) => {
	const openNoteContextMenu = useDefaultNoteContextMenu({ closeNote: onClose, notesRegistry, updateNotes });

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
