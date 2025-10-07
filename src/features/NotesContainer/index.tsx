import React, { FC, useEffect, useRef } from 'react';
import { WorkspaceEvents } from '@api/events/workspace';
import { Box, StackProps, VStack } from '@chakra-ui/react';
import { INote } from '@core/features/notes';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import {
	useEventBus,
	useNotesContext,
	useNotesHistory,
	useNotesRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { Notes } from '@features/MainScreen/Notes';
import { TopBar } from '@features/MainScreen/TopBar';
import { useTelemetryTracker } from '@features/telemetry';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useNoteShortcutActions } from '@hooks/notes/useNoteShortcutActions';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useImmutableCallback } from '@hooks/useImmutableCallback';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId, selectOpenedNotes } from '@state/redux/profiles/profiles';
import { createWorkspaceSelector } from '@state/redux/profiles/utils';
import { joinCallbacks } from '@utils/react/joinCallbacks';

import { EditorModePicker } from './EditorModePicker/EditorModePicker';

export type NotesContainerProps = Partial<StackProps>;

export const NotesContainer: FC<NotesContainerProps> = ({ ...props }) => {
	const telemetry = useTelemetryTracker();

	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const notesRegistry = useNotesRegistry();
	const { noteUpdated } = useNotesContext();
	const noteHistory = useNotesHistory();

	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	const tabs = useWorkspaceSelector((state) =>
		createWorkspaceSelector([selectOpenedNotes], (notes) =>
			notes.map((note) => note.id),
		)(state),
	);

	const eventBus = useEventBus();
	useEffect(() => {
		return joinCallbacks(
			eventBus.listen(WorkspaceEvents.NOTES_UPDATED, updateNotes),
			eventBus.listen(WorkspaceEvents.NOTE_UPDATED, (noteId) => {
				updateNotes();
				notesRegistry.getById(noteId).then((note) => {
					if (note) noteUpdated(note);
				});
			}),
		);
	}, [eventBus, noteUpdated, notesRegistry, updateNotes]);

	// Simulate note update
	const syncJobsRef = useRef<Record<string, NodeJS.Timeout>>({});
	const updateNote = useImmutableCallback(
		async (note: INote) => {
			noteUpdated(note);

			await notesRegistry.update(note.id, note.content);
			await notesRegistry.updateMeta([note.id], {
				isSnapshotsDisabled: note.isSnapshotsDisabled,
			});
			eventBus.emit(WorkspaceEvents.NOTE_EDITED, note.id);

			await updateNotes();

			// Reset sync job if any
			if (syncJobsRef.current[note.id]) {
				clearTimeout(syncJobsRef.current[note.id]);
				delete syncJobsRef.current[note.id];
			}

			// Sync by timeout
			if (!note.isSnapshotsDisabled) {
				syncJobsRef.current[note.id] = setTimeout(async () => {
					delete syncJobsRef.current[note.id];

					await noteHistory.snapshot(note.id);
					eventBus.emit(WorkspaceEvents.NOTE_HISTORY_UPDATED, note.id);
				}, 10 * 1000);
			}
		},
		[eventBus, noteHistory, noteUpdated, notesRegistry, updateNotes],
	);

	useNoteShortcutActions();

	return (
		<VStack align="start" w="100%" h="100%" gap={0} overflow="hidden" {...props}>
			<TopBar
				{...{
					updateNotes,
					notes: openedNotes,
					tabs,
					activeTab: activeNoteId ?? null,
					onClose(id) {
						noteActions.close(id);
						telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CLOSED, {
							context: 'top bar',
						});
					},
					onPick(id) {
						noteActions.click(id);
						telemetry.track(TELEMETRY_EVENT_NAME.NOTE_OPENED, {
							context: 'top bar',
						});
					},
				}}
			/>
			<Box
				display="flex"
				flexGrow="100"
				width="100%"
				overflow="auto"
				padding=".5rem"
			>
				<Notes
					{...{
						notes: openedNotes,
						tabs,
						activeTab: activeNoteId ?? null,
						updateNote,
					}}
				/>
			</Box>
			<EditorModePicker />
		</VStack>
	);
};
