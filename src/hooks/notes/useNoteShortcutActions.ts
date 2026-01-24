import { WorkspaceEvents } from '@api/events/workspace';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useEventBus, useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { useCreateNote } from '@hooks/notes/useCreateNote';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveNoteId,
	selectOpenedNotes,
	selectRecentlyClosedNotes,
} from '@state/redux/profiles/profiles';
import { getItemByOffset } from '@utils/collections/getItemByOffset';

/**
 * Hook handles note actions triggered via keyboard shortcuts, including create, close, restore, switch focus and etc.,
 */
export const useNoteShortcutActions = () => {
	const telemetry = useTelemetryTracker();

	const noteActions = useNoteActions();
	const createNote = useCreateNote();
	const notesRegistry = useNotesRegistry();
	const runCommand = useCommand();
	const eventBus = useEventBus();

	const recentlyClosedNotes = useWorkspaceSelector(selectRecentlyClosedNotes);
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.CREATE_NOTE, () => {
		createNote();

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CREATED, {
			context: 'shortcut',
		});
	});

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE, () => {
		if (!activeNoteId) return;
		noteActions.close(activeNoteId);

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CLOSED, {
			context: 'shortcut',
		});
	});

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE, () => {
		const lastClosedNote = recentlyClosedNotes[recentlyClosedNotes.length - 1];
		if (!lastClosedNote) return;
		noteActions.click(lastClosedNote);
	});

	const focusNoteInDirection = (direction: 'next' | 'previous') => {
		if (!activeNoteId) return;
		const noteIndex = openedNotes.findIndex((note) => note.id === activeNoteId);
		if (noteIndex === -1) return;

		const offset = direction === 'next' ? 1 : -1;
		const note = getItemByOffset(openedNotes, noteIndex, offset);
		if (!note) return;

		noteActions.click(note.id);
	};

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE, () =>
		focusNoteInDirection('previous'),
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.FOCUS_NEXT_NOTE, () =>
		focusNoteInDirection('next'),
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.TOGGLE_CURRENT_NOTE_ARCHIVE, async () => {
		if (!activeNoteId) return;
		const note = await notesRegistry.getById(activeNoteId);
		if (!note) return;

		const newArchivedState = !note.isArchived;
		await notesRegistry.updateMeta([activeNoteId], {
			isArchived: newArchivedState,
		});
		eventBus.emit(WorkspaceEvents.NOTE_UPDATED, activeNoteId);

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_ARCHIVE_TOGGLE, {
			action: newArchivedState ? 'Added' : 'Removed',
		});
	});

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.TOGGLE_CURRENT_NOTE_BOOKMARK,
		async () => {
			if (!activeNoteId) return;
			const note = await notesRegistry.getById(activeNoteId);
			if (!note) return;

			const newBookmarkedState = !note.isBookmarked;
			await notesRegistry.updateMeta([activeNoteId], {
				isBookmarked: newBookmarkedState,
			});
			eventBus.emit(WorkspaceEvents.NOTE_UPDATED, activeNoteId);

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_BOOKMARK_TOGGLE, {
				action: newBookmarkedState ? 'Added' : 'Removed',
			});
		},
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.DELETE_CURRENT_NOTE_TO_BIN, () => {
		if (!activeNoteId) return;
		runCommand(GLOBAL_COMMANDS.DELETE_NOTE_TO_BIN, { id: activeNoteId });
	});

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.RESTORE_CURRENT_NOTE_FROM_BIN,
		async () => {
			if (!activeNoteId) return;
			const note = await notesRegistry.getById(activeNoteId);
			if (note && !note.isDeleted) return;

			runCommand(GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN, { id: activeNoteId });
		},
	);
	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.DELETE_CURRENT_NOTE_PERMANENTLY,
		async () => {
			if (!activeNoteId) return;
			const note = await notesRegistry.getById(activeNoteId);
			if (note && !note.isDeleted) return;

			runCommand(GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY, { id: activeNoteId });
		},
	);
};
