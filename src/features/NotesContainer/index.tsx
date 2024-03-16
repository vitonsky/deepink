import React, { FC, useCallback } from 'react';
import { useStoreMap } from 'effector-react';
import { IStackProps, Stack } from '@components/Stack/Stack';
import { INote, NoteId } from '@core/features/notes';
import { cnMainScreen } from '@features/MainScreen';
import { Notes } from '@features/MainScreen/Notes';
import { TopBar } from '@features/MainScreen/TopBar';
import {
	useNotesContext,
	useNotesRegistry,
	useTagsContext,
} from '@features/Workspace/WorkspaceProvider';

export const useNoteActions = () => {
	const activeNotesContext = useNotesContext();
	const { events: notesEvents } = activeNotesContext;

	const openedNotes = useStoreMap(
		activeNotesContext.$notes,
		({ openedNotes }) => openedNotes,
	);

	const notes = useStoreMap(activeNotesContext.$notes, ({ notes }) => notes);

	// TODO: focus on note input
	const click = useCallback(
		(id: NoteId) => {
			const isNoteOpened = openedNotes.some((note) => note.id === id);
			if (isNoteOpened) {
				notesEvents.activeNoteChanged(id);
			} else {
				const note = notes.find((note) => note.id === id);
				if (note) {
					notesEvents.noteOpened(note);
				}
			}
		},
		[notes, notesEvents, openedNotes],
	);

	const close = useCallback(
		(id: NoteId) => {
			notesEvents.noteClosed(id);
		},
		[notesEvents],
	);

	return { click, close };
};

export const useUpdateNotes = () => {
	const notesRegistry = useNotesRegistry();
	const activeNotesContext = useNotesContext();

	const setNotes = activeNotesContext.events.setNotes;

	const { $tags } = useTagsContext();
	const activeTag = useStoreMap($tags, ({ selected }) => selected);

	return useCallback(async () => {
		const tags = activeTag === null ? [] : [activeTag];
		const notes = await notesRegistry.get({ limit: 10000, tags });
		notes.sort((a, b) => {
			const timeA = a.updatedTimestamp ?? a.createdTimestamp ?? 0;
			const timeB = b.updatedTimestamp ?? b.createdTimestamp ?? 0;

			if (timeA > timeB) return -1;
			if (timeB > timeA) return 1;
			return 0;
		});
		setNotes(notes);
	}, [activeTag, notesRegistry]);
};

export type NotesContainerProps = Partial<IStackProps> & {};

export const NotesContainer: FC<NotesContainerProps> = ({ ...props }) => {
	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const notesRegistry = useNotesRegistry();
	const activeNotesContext = useNotesContext();
	const { events: notesEvents } = activeNotesContext;

	const activeNoteId = useStoreMap(
		activeNotesContext.$notes,
		({ activeNote }) => activeNote,
	);

	const openedNotes = useStoreMap(
		activeNotesContext.$notes,
		({ openedNotes }) => openedNotes,
	);

	const tabs = useStoreMap(activeNotesContext.$notes, ({ openedNotes }) =>
		openedNotes.map((note) => note.id),
	);

	// Simulate note update
	const updateNote = useCallback(
		async (note: INote) => {
			notesEvents.noteUpdated(note);
			await notesRegistry.update(note.id, note.content);
			await updateNotes();
		},
		[notesEvents, notesRegistry, updateNotes],
	);

	return (
		<Stack
			{...props}
			direction="vertical"
			spacing={2}
			className={cnMainScreen('ContentBlock')}
		>
			<TopBar
				{...{
					notesRegistry,
					updateNotes,
					notes: openedNotes,
					tabs,
					activeTab: activeNoteId ?? null,
					onClose: noteActions.close,
					onPick: noteActions.click,
				}}
			/>
			<div className={cnMainScreen('NoteEditors')}>
				<Notes
					{...{
						notes: openedNotes,
						tabs,
						activeTab: activeNoteId ?? null,
						updateNote,
					}}
				/>
			</div>
		</Stack>
	);
};
