import React, { FC } from 'react';
import { cn } from '@bem-react/classname';

import { INote, NoteId } from '../../../../core/Note';
import { INotesController } from '../../../../core/storage/controllers/notes';
import { Stack } from '../../../components/Stack/Stack';

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
	notesRegistry: INotesController;

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
	const openNoteContextMenu = useDefaultNoteContextMenu({
		closeNote: onClose,
		notesRegistry,
		updateNotes,
	});

	// TODO: get preview text from DB as prepared value
	// TODO: show attachments
	// TODO: implement dragging and moving items
	return (
		<Stack direction="vertical" className={cnNotesList()}>
			{notes.map((note) => {
				const date = note.createdTimestamp ?? note.updatedTimestamp;
				return (
					<Stack
						key={note.id}
						spacing={2}
						direction="vertical"
						className={cnNotesList('Note', {
							active: note.id === activeNote,
							opened: openedNotes && openedNotes.indexOf(note.id) !== -1,
						})}
						onContextMenu={(evt) => {
							openNoteContextMenu(note.id, {
								x: evt.pageX,
								y: evt.pageY,
							});
						}}
						onClick={() => {
							onPick(note.id);
						}}
					>
						<div className={cnNotesList('Title')}>
							{getNoteTitle(note.data)}
						</div>
						<div className={cnNotesList('TextPreview')}>
							{note.data.text.slice(0, 80)}
						</div>
						{date && (
							<div className={cnNotesList('Meta')}>
								{new Date(date).toDateString()}
							</div>
						)}
					</Stack>
				);
			})}
		</Stack>
	);
};
