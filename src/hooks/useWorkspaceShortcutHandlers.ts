import { GLOBAL_COMMANDS } from '@hooks/commands';
import { Shortcuts } from '@hooks/commands/shortcuts';
import { useCommand } from '@hooks/commands/useCommand';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId } from '@state/redux/profiles/profiles';

import { useShortcutCallback } from './commands/shortcuts/useShortcutCallback';
import { useIsActiveWorkspace } from './useIsActiveWorkspace';

/**
 * Registers workspace keyboard shortcut handlers
 */
export const useWorkspaceShortcutHandlers = () => {
	const command = useCommand();
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);

	const isActiveWorkspace = useIsActiveWorkspace();

	useShortcutCallback(
		Shortcuts.CREATE_NOTE,
		() => command(GLOBAL_COMMANDS.CREATE_NOTE),
		{ enabled: isActiveWorkspace },
	);

	useShortcutCallback(
		Shortcuts.CLOSE_CURRENT_NOTE,
		() => command(GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE),
		{ enabled: isActiveWorkspace },
	);

	useShortcutCallback(
		Shortcuts.FOCUS_NEXT_NOTE,
		() => command(GLOBAL_COMMANDS.FOCUS_NEXT_NOTE),
		{ enabled: isActiveWorkspace },
	);

	useShortcutCallback(
		Shortcuts.FOCUS_PREVIOUS_NOTE,
		() => command(GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE),
		{ enabled: isActiveWorkspace },
	);

	useShortcutCallback(
		Shortcuts.FOCUS_SEARCH,
		() => command(GLOBAL_COMMANDS.FOCUS_SEARCH),
		{ enabled: isActiveWorkspace },
	);

	useShortcutCallback(
		Shortcuts.TOGGLE_CURRENT_NOTE_ARCHIVE,
		() => {
			if (!activeNoteId) return;
			command(GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE, { noteId: activeNoteId });
		},
		{ enabled: isActiveWorkspace },
	);

	useShortcutCallback(
		Shortcuts.TOGGLE_CURRENT_NOTE_BOOKMARK,
		() => {
			if (!activeNoteId) return;
			command(GLOBAL_COMMANDS.TOGGLE_NOTE_BOOKMARK, { noteId: activeNoteId });
		},
		{ enabled: isActiveWorkspace },
	);

	useShortcutCallback(
		Shortcuts.TOGGLE_CURRENT_NOTE_HISTORY_PANEL,
		() => {
			if (!activeNoteId) return;
			command(GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY_PANEL, { noteId: activeNoteId });
		},
		{ enabled: isActiveWorkspace },
	);

	useShortcutCallback(
		Shortcuts.DELETE_NOTE,
		async () => {
			if (!activeNoteId) return;
			command(GLOBAL_COMMANDS.DELETE_NOTE, { noteId: activeNoteId });
		},
		{ enabled: isActiveWorkspace },
	);

	useShortcutCallback(
		Shortcuts.RESTORE_NOTE_FROM_BIN,
		async () => {
			if (!activeNoteId) return;
			command(GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN, { noteId: activeNoteId });
		},
		{ enabled: isActiveWorkspace },
	);
};
