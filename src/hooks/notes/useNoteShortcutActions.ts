import { WorkspaceEvents } from '@api/events/workspace';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useEventBus, useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { Shortcuts } from '@hooks/commands/shortcuts';
import { useShortcutCallback } from '@hooks/commands/shortcuts/shortcutsCallback';
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

export const useCallShortcut = () => {
	const notesRegistry = useNotesRegistry();
	const command = useCommand();
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);

	const shortcutHandlers: Partial<Record<Shortcuts, () => void>> = {
		[Shortcuts.CREATE_NOTE]: () => command(GLOBAL_COMMANDS.CREATE_NOTE),

		[Shortcuts.CLOSE_CURRENT_NOTE]: () => command(GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE),

		[Shortcuts.RESTORE_CLOSED_NOTE]: () =>
			command(GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE),

		[Shortcuts.OPEN_CURRENT_NOTE_HISTORY]: () =>
			command(GLOBAL_COMMANDS.OPEN_CURRENT_NOTE_HISTORY),

		[Shortcuts.FOCUS_NEXT_NOTE]: () => command(GLOBAL_COMMANDS.FOCUS_NEXT_NOTE),

		[Shortcuts.FOCUS_PREVIOUS_NOTE]: () =>
			command(GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE),

		[Shortcuts.LOCK_CURRENT_PROFILE]: () =>
			command(GLOBAL_COMMANDS.LOCK_CURRENT_PROFILE),

		[Shortcuts.SYNC_DATABASE]: () => command(GLOBAL_COMMANDS.SYNC_DATABASE),

		[Shortcuts.FOCUS_SEARCH]: () => command(GLOBAL_COMMANDS.FOCUS_SEARCH),

		[Shortcuts.TOGGLE_CURRENT_NOTE_ARCHIVE]: () =>
			command(GLOBAL_COMMANDS.TOGGLE_CURRENT_NOTE_ARCHIVE),

		[Shortcuts.TOGGLE_CURRENT_NOTE_BOOKMARK]: () =>
			command(GLOBAL_COMMANDS.TOGGLE_CURRENT_NOTE_BOOKMARK),
	};

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.SHORTCUTS_PRESSED, (payload) => {
		const handler = shortcutHandlers[payload];
		if (!handler) return;
		handler();
	});

	useShortcutCallback(Shortcuts.DELETE_NOTE_TO_BIN, () => {
		if (!activeNoteId) return;
		command(GLOBAL_COMMANDS.DELETE_NOTE_TO_BIN, { id: activeNoteId });
	});

	useShortcutCallback(Shortcuts.RESTORE_NOTE_FROM_BIN, async () => {
		if (!activeNoteId) return;
		const note = await notesRegistry.getById(activeNoteId);
		if (note && !note.isDeleted) return;

		command(GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN, { id: activeNoteId });
	});

	useShortcutCallback(Shortcuts.DELETE_NOTE_PERMANENTLY, async () => {
		if (!activeNoteId) return;
		const note = await notesRegistry.getById(activeNoteId);
		if (note && !note.isDeleted) return;

		command(GLOBAL_COMMANDS.DELETE_NOTE_TO_BIN, { id: activeNoteId });
	});
};

/**
 * Hook handles note actions triggered via keyboard shortcuts, including create, close, restore, switch focus and etc.,
 */
export const useNoteShortcutActions = () => {
	const telemetry = useTelemetryTracker();

	const noteActions = useNoteActions();
	const createNote = useCreateNote();
	const notesRegistry = useNotesRegistry();
	const eventBus = useEventBus();

	const recentlyClosedNotes = useWorkspaceSelector(selectRecentlyClosedNotes);
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	useCallShortcut();

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
};
