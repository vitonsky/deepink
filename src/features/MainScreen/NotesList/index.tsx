import React, { FC } from 'react';
import { Text, VStack } from '@chakra-ui/react';
import { NotePreview } from '@components/NotePreview/NotePreview';
import { getNoteTitle } from '@core/features/notes/utils';
import { useCommandSubscription } from '@features/App/hotkey/commandHooks';
import { SHORTCUT_COMMANDS } from '@features/App/hotkey/shortcuts';
import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveNoteId,
	selectNotes,
	selectOpenedNotes,
	selectRecentlyClosedNote,
} from '@state/redux/profiles/profiles';

import { useDefaultNoteContextMenu } from './NoteContextMenu/useDefaultNoteContextMenu';

export type NotesListProps = {};

export const NotesList: FC<NotesListProps> = () => {
	const notesRegistry = useNotesRegistry();
	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const recentlyClosedNotes = useWorkspaceSelector(selectRecentlyClosedNote);
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const notes = useWorkspaceSelector(selectNotes);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	const openNoteContextMenu = useDefaultNoteContextMenu({
		closeNote: noteActions.close,
		notesRegistry,
		updateNotes,
	});

	useCommandSubscription(SHORTCUT_COMMANDS.CLOSE_NOTE, () => {
		if (!activeNoteId) return;
		noteActions.close(activeNoteId);
	});
	useCommandSubscription(SHORTCUT_COMMANDS.RESTORE_CLOSED_NOTE, () => {
		if (!recentlyClosedNotes || !recentlyClosedNotes.length) return;
		noteActions.click(recentlyClosedNotes[recentlyClosedNotes.length - 1]);
	});

	useCommandSubscription(SHORTCUT_COMMANDS.OPEN_NEXT_NOTE, () => {
		if (openedNotes.length <= 1 || !activeNoteId) return;

		const currentIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
		const isLastNote = currentIndex + 1 === openedNotes.length;
		const nextIndex = isLastNote ? 0 : currentIndex + 1;

		// If the current note is the last in the array, go back to the first
		noteActions.click(openedNotes[nextIndex].id);
	});
	useCommandSubscription(SHORTCUT_COMMANDS.OPEN_PREVIOUSLY_NOTE, () => {
		if (openedNotes.length <= 1 || !activeNoteId) return;

		const currentIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
		const isFirstNote = currentIndex === 0;
		const previouslyIndex = isFirstNote ? openedNotes.length - 1 : currentIndex - 1;

		// If the current note is the first in the array, go to the last
		noteActions.click(openedNotes[previouslyIndex].id);
	});

	// TODO: implement dragging and moving items
	return (
		<VStack
			sx={{
				w: '100%',
				h: '100%',
				overflow: 'auto',
				align: 'center',
				userSelect: 'none',
			}}
		>
			{notes.length === 0 ? (
				<Text pos="relative" top="40%">
					Nothing added yet
				</Text>
			) : (
				<VStack
					sx={{
						w: '100%',
						align: 'start',
						gap: '4px',
					}}
				>
					{notes.map((note) => {
						const date = note.createdTimestamp ?? note.updatedTimestamp;
						const text = note.content.text.slice(0, 80).trim();

						// TODO: get preview text from DB as prepared value
						// TODO: show attachments
						return (
							<NotePreview
								key={note.id}
								isSelected={note.id === activeNoteId}
								title={getNoteTitle(note.content)}
								text={text}
								meta={
									date && <Text>{new Date(date).toDateString()}</Text>
								}
								onContextMenu={(evt) => {
									openNoteContextMenu(note.id, {
										x: evt.pageX,
										y: evt.pageY,
									});
								}}
								onClick={() => {
									noteActions.click(note.id);
								}}
							/>
						);
					})}
				</VStack>
			)}
		</VStack>
	);
};
