import { useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { Shortcuts } from '@hooks/commands/shortcuts';
import { useCommand } from '@hooks/commands/useCommand';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId } from '@state/redux/profiles/profiles';

/**
 * Registers workspace keyboard shortcut handlers
 */
export const useWorkspaceShortcutHandlers = () => {
	const notesRegistry = useNotesRegistry();
	const command = useCommand();
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);

	// Execute commands that require an active note
	const commandWithActiveNote = (commandName: GLOBAL_COMMANDS, payload?: {}) => {
		if (!activeNoteId) return;
		command(commandName, { noteId: activeNoteId, ...payload });
	};

	const shortcutToCommandMap: Partial<Record<Shortcuts, () => void>> = {
		[Shortcuts.CREATE_NOTE]: () => command(GLOBAL_COMMANDS.CREATE_NOTE),

		[Shortcuts.CLOSE_CURRENT_NOTE]: () => command(GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE),

		[Shortcuts.RESTORE_CLOSED_NOTE]: () =>
			command(GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE),

		[Shortcuts.FOCUS_NEXT_NOTE]: () => command(GLOBAL_COMMANDS.FOCUS_NEXT_NOTE),

		[Shortcuts.FOCUS_PREVIOUS_NOTE]: () =>
			command(GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE),

		[Shortcuts.FOCUS_SEARCH]: () => command(GLOBAL_COMMANDS.FOCUS_SEARCH),

		[Shortcuts.TOGGLE_CURRENT_NOTE_HISTORY]: async () =>
			commandWithActiveNote(GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY),

		[Shortcuts.TOGGLE_CURRENT_NOTE_ARCHIVE]: async () =>
			commandWithActiveNote(GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE),

		[Shortcuts.TOGGLE_CURRENT_NOTE_BOOKMARK]: async () =>
			commandWithActiveNote(GLOBAL_COMMANDS.TOGGLE_NOTE_BOOKMARK),

		[Shortcuts.DELETE_NOTE_TO_BIN]: async () => {
			if (!activeNoteId) return;
			const note = await notesRegistry.getById(activeNoteId);
			if (note && note.isDeleted) {
				console.warn(`Note with id ${activeNoteId} is already in the bin`);
				return;
			}

			commandWithActiveNote(GLOBAL_COMMANDS.DELETE_NOTE, { permanently: false });
		},

		[Shortcuts.DELETE_NOTE_PERMANENTLY]: async () => {
			if (!activeNoteId) return;
			const note = await notesRegistry.getById(activeNoteId);
			if (note && !note.isDeleted) return;

			commandWithActiveNote(GLOBAL_COMMANDS.DELETE_NOTE, { permanently: true });
		},

		[Shortcuts.RESTORE_NOTE_FROM_BIN]: async () => {
			if (!activeNoteId) return;
			const note = await notesRegistry.getById(activeNoteId);

			// only a deleted note can be restored from the bin
			if (note && !note.isDeleted) return;

			commandWithActiveNote(GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN);
		},
	};

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.SHORTCUTS_PRESSED, (pressedShortcut) => {
		const commandToExecute = shortcutToCommandMap[pressedShortcut];
		if (!commandToExecute) return;
		commandToExecute();
	});
};
