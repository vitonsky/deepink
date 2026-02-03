import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { Shortcuts } from '@hooks/commands/shortcuts';
import { useWorkspaceShortcutCallback } from '@hooks/commands/shortcuts/useWorkspaceShortcutCallback';
import { useCommand } from '@hooks/commands/useCommand';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId } from '@state/redux/profiles/profiles';

const shortcutToCommandMap: Partial<Record<Shortcuts, GLOBAL_COMMANDS>> = {
	[Shortcuts.CREATE_NOTE]: GLOBAL_COMMANDS.CREATE_NOTE,
	[Shortcuts.CLOSE_CURRENT_NOTE]: GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE,
	[Shortcuts.RESTORE_CLOSED_NOTE]: GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE,
	[Shortcuts.FOCUS_NEXT_NOTE]: GLOBAL_COMMANDS.FOCUS_NEXT_NOTE,
	[Shortcuts.FOCUS_PREVIOUS_NOTE]: GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE,
	[Shortcuts.FOCUS_SEARCH]: GLOBAL_COMMANDS.FOCUS_SEARCH,
};

/**
 * Registers workspace keyboard shortcut handlers
 */
export const useWorkspaceShortcutHandlers = () => {
	const notesRegistry = useNotesRegistry();
	const command = useCommand();
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);

	// Simple shortcuts that not require a payload
	useWorkspaceCommandCallback(GLOBAL_COMMANDS.SHORTCUTS_PRESSED, (pressedShortcut) => {
		const commandToExecute = shortcutToCommandMap[pressedShortcut];
		if (!commandToExecute) return;
		command(commandToExecute);
	});

	// Execute commands that require an active note
	const executeWithActiveNote = (commandName: GLOBAL_COMMANDS, payload?: {}) => {
		if (!activeNoteId) return;
		command(commandName, { noteId: activeNoteId, ...payload });
	};

	useWorkspaceShortcutCallback(Shortcuts.DELETE_NOTE_TO_BIN, () =>
		executeWithActiveNote(GLOBAL_COMMANDS.DELETE_NOTE, { permanent: false }),
	);

	useWorkspaceShortcutCallback(Shortcuts.DELETE_NOTE_PERMANENTLY, async () => {
		if (!activeNoteId) return;
		const note = await notesRegistry.getById(activeNoteId);
		if (note && !note.isDeleted) return;

		executeWithActiveNote(GLOBAL_COMMANDS.DELETE_NOTE, { permanent: true });
	});

	useWorkspaceShortcutCallback(Shortcuts.RESTORE_NOTE_FROM_BIN, async () => {
		if (!activeNoteId) return;
		const note = await notesRegistry.getById(activeNoteId);
		if (note && !note.isDeleted) return;

		executeWithActiveNote(GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN);
	});

	useWorkspaceShortcutCallback(Shortcuts.TOGGLE_CURRENT_NOTE_HISTORY, () =>
		executeWithActiveNote(GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY),
	);

	useWorkspaceShortcutCallback(Shortcuts.TOGGLE_CURRENT_NOTE_ARCHIVE, () =>
		executeWithActiveNote(GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE),
	);

	useWorkspaceShortcutCallback(Shortcuts.TOGGLE_CURRENT_NOTE_BOOKMARK, () =>
		executeWithActiveNote(GLOBAL_COMMANDS.TOGGLE_NOTE_BOOKMARK),
	);
};
