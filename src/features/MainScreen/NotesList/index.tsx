import React, { FC } from 'react';
import { cn } from '@bem-react/classname';
import { Stack } from '@components/Stack/Stack';
import { getNoteTitle } from '@core/features/notes/utils';
import { useNotesRegistry } from '@features/Workspace/WorkspaceProvider';
import { useAppSelector } from '@state/redux/hooks';
import { createAppSelector } from '@state/redux/utils';
import {
	selectActiveNoteId,
	selectNotes,
	selectOpenedNotes,
} from '@state/redux/workspaces';

import { useNoteActions } from '../../../hooks/notes/useNoteActions';
import { useUpdateNotes } from '../../../hooks/notes/useUpdateNotes';

import { useDefaultNoteContextMenu } from './NoteContextMenu/useDefaultNoteContextMenu';

import './NotesList.css';

export const cnNotesList = cn('NotesList');

export type NotesListProps = {};

export const NotesList: FC<NotesListProps> = () => {
	const notesRegistry = useNotesRegistry();
	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const activeNoteId = useAppSelector(selectActiveNoteId('default'));
	const openedNotesIdList = useAppSelector(
		createAppSelector(selectOpenedNotes('default'), (notes) =>
			notes.map((note) => note.id),
		),
	);
	const notes = useAppSelector(selectNotes('default'));

	const openNoteContextMenu = useDefaultNoteContextMenu({
		closeNote: noteActions.close,
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
							active: note.id === activeNoteId,
							opened:
								openedNotesIdList &&
								openedNotesIdList.indexOf(note.id) !== -1,
						})}
						onContextMenu={(evt) => {
							openNoteContextMenu(note.id, {
								x: evt.pageX,
								y: evt.pageY,
							});
						}}
						onClick={() => {
							noteActions.click(note.id);
						}}
					>
						<div className={cnNotesList('Title')}>
							{getNoteTitle(note.content)}
						</div>
						<div className={cnNotesList('TextPreview')}>
							{note.content.text.slice(0, 80)}
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
