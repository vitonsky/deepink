import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { useCreateNote } from '@hooks/notes/useCreateNote';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId, workspacesApi } from '@state/redux/profiles/profiles';

/**
 * Hook handles note actions triggered via keyboard shortcuts, including create, close, restore and switch focus
 */
export const useNoteShortcutActions = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);

	const noteActions = useNoteActions();
	const createNote = useCreateNote();

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.CREATE_NOTE, createNote);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE,
		() => {
			if (activeNoteId) noteActions.close(activeNoteId);
		},
		{ enabled: Boolean(activeNoteId) },
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE, () =>
		dispatch(workspacesApi.setLastClosedNoteActive({ ...workspaceData })),
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE, () =>
		dispatch(workspacesApi.switchActiveNote({ ...workspaceData, offset: -1 })),
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.FOCUS_NEXT_NOTE, () =>
		dispatch(workspacesApi.switchActiveNote({ ...workspaceData, offset: 1 })),
	);
};
