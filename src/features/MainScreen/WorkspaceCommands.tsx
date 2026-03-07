import { useWorkspaceShortcutsHandlers } from '@features/App/Workspace/useWorkspaceShortcutsHandlers';
import { useNoteCommandHandlers } from '@hooks/notes/useNoteCommandHandlers';
import { useNotesShortcutActions } from '@hooks/notes/useNotesShortcutActions';

export const WorkspaceCommands = () => {
	useWorkspaceShortcutsHandlers();
	useNoteCommandHandlers();
	useNotesShortcutActions();

	return null;
};
