import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { Shortcuts } from '@hooks/shortcuts';
import { useWorkspaceShortcutsCallback } from '@hooks/shortcuts/useWorkspaceShortcutsCallback';
import { useVaultSelector, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId } from '@state/redux/profiles/profiles';
import { selectDeletionConfig } from '@state/redux/profiles/selectors/vault';

import { useNotesRegistry } from './WorkspaceProvider';

/**
 * Registers workspace keyboard shortcuts handlers
 */
export const useWorkspaceShortcutsHandlers = () => {
	const command = useCommand();
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const notes = useNotesRegistry();

	useWorkspaceShortcutsCallback(Shortcuts.CREATE_NOTE, () =>
		command(GLOBAL_COMMANDS.CREATE_NOTE),
	);

	useWorkspaceShortcutsCallback(Shortcuts.RESTORE_CLOSED_NOTE, () =>
		command(GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE),
	);

	useWorkspaceShortcutsCallback(Shortcuts.CLOSE_CURRENT_NOTE, () =>
		command(GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE),
	);

	useWorkspaceShortcutsCallback(Shortcuts.FOCUS_NEXT_NOTE, () =>
		command(GLOBAL_COMMANDS.FOCUS_NEXT_NOTE),
	);

	useWorkspaceShortcutsCallback(Shortcuts.FOCUS_PREVIOUS_NOTE, () =>
		command(GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE),
	);

	useWorkspaceShortcutsCallback(Shortcuts.FOCUS_SEARCH, () =>
		command(GLOBAL_COMMANDS.FOCUS_SEARCH),
	);

	useWorkspaceShortcutsCallback(Shortcuts.TOGGLE_CURRENT_NOTE_ARCHIVE, () => {
		if (!activeNoteId) return;
		command(GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE, { noteId: activeNoteId });
	});

	useWorkspaceShortcutsCallback(Shortcuts.TOGGLE_CURRENT_NOTE_BOOKMARK, () => {
		if (!activeNoteId) return;
		command(GLOBAL_COMMANDS.TOGGLE_NOTE_BOOKMARK, { noteId: activeNoteId });
	});

	useWorkspaceShortcutsCallback(Shortcuts.TOGGLE_CURRENT_NOTE_HISTORY_PANEL, () => {
		if (!activeNoteId) return;
		command(GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY_PANEL, { noteId: activeNoteId });
	});

	const deletionConfig = useVaultSelector(selectDeletionConfig);
	useWorkspaceShortcutsCallback(Shortcuts.DELETE_CURRENT_NOTE, async () => {
		if (!activeNoteId) return;

		const [note] = await notes.getById([activeNoteId]);
		if (!note) return;

		if (deletionConfig.permanentDeletion || note.isDeleted) {
			command(GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY, {
				noteId: activeNoteId,
			});
			return;
		}

		command(GLOBAL_COMMANDS.MOVE_NOTE_TO_BIN, {
			noteId: activeNoteId,
		});
	});

	useWorkspaceShortcutsCallback(Shortcuts.RESTORE_CURRENT_NOTE_FROM_BIN, () => {
		if (!activeNoteId) return;
		command(GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN, { noteId: activeNoteId });
	});
};
