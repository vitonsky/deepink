import { useWorkspaceShortcutsHandlers } from '@features/App/Workspace/useWorkspaceShortcutsHandlers';
import { useNoteCommandHandlers } from '@hooks/notes/useNoteCommandHandlers';

export const WorkspaceCommandRegistry = () => {
	useWorkspaceShortcutsHandlers();
	useNoteCommandHandlers();

	return null;
};
