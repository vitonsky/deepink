import { useCallback, useContext, useMemo } from 'react';
import { isEqual } from 'lodash';
import { GLOBAL_COMMANDS } from '@core/features/commands';
import { useCommandCallback } from '@core/features/commands/commandHooks';
import { WorkspaceContext } from '@features/App/Workspace';
import { useCreateNote } from '@hooks/notes/useCreateNote';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveNoteId,
	selectActiveWorkspaceInfo,
	selectOpenedNotes,
	selectRecentlyClosedNotes,
} from '@state/redux/profiles/profiles';
import { getItemByOffset } from '@utils/collections/getItemByOffset';

/**
 * Hook handles note actions triggered via keyboard shortcuts, including create, close, restore and switch focus
 */
export const useNoteShortcutActions = () => {
	const noteActions = useNoteActions();
	const createNote = useCreateNote();

	const recentlyClosedNotes = useWorkspaceSelector(selectRecentlyClosedNotes);
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	const currentWorkspace = useContext(WorkspaceContext);
	const { profileId } = useWorkspaceData();
	const activeWorkspace = useAppSelector(
		useMemo(() => selectActiveWorkspaceInfo({ profileId }), [profileId]),
		isEqual,
	);

	const createWorkspaceCommand = (callback: () => void) => {
		return () => {
			if (!currentWorkspace)
				throw new Error('WorkspaceContext required but missing');

			// This check is needed because multiple workspaces can run at the same time
			// Without filtering, every workspace would handle the same command, causing unwanted side effects across all of them
			if (activeWorkspace?.id !== currentWorkspace?.workspaceId) return;
			callback();
		};
	};

	useCommandCallback(GLOBAL_COMMANDS.CREATE_NOTE, createWorkspaceCommand(createNote));

	useCommandCallback(
		GLOBAL_COMMANDS.CLOSE_CURRENT_NOTE,
		createWorkspaceCommand(
			useCallback(() => {
				if (!activeNoteId) return;
				noteActions.close(activeNoteId);
			}, [activeNoteId, noteActions]),
		),
	);

	useCommandCallback(
		GLOBAL_COMMANDS.RESTORE_CLOSED_NOTE,
		createWorkspaceCommand(
			useCallback(() => {
				const lastClosedNote =
					recentlyClosedNotes[recentlyClosedNotes.length - 1];
				if (!lastClosedNote) return;
				noteActions.click(lastClosedNote);
			}, [noteActions, recentlyClosedNotes]),
		),
	);

	useCommandCallback(
		GLOBAL_COMMANDS.FOCUS_PREVIOUS_NOTE,
		createWorkspaceCommand(
			useCallback(() => {
				const noteIndex = openedNotes.findIndex(
					(note) => note.id === activeNoteId,
				);
				if (noteIndex === -1) return;
				const previousNote = getItemByOffset(openedNotes, noteIndex, 1);
				if (!previousNote) return;

				noteActions.click(previousNote.id);
			}, [activeNoteId, noteActions, openedNotes]),
		),
	);

	useCommandCallback(
		GLOBAL_COMMANDS.FOCUS_NEXT_NOTE,
		createWorkspaceCommand(
			useCallback(() => {
				const noteIndex = openedNotes.findIndex(
					(note) => note.id === activeNoteId,
				);
				if (noteIndex === -1) return;
				const nextNote = getItemByOffset(openedNotes, noteIndex, -1);
				if (!nextNote) return;

				noteActions.click(nextNote.id);
			}, [activeNoteId, noteActions, openedNotes]),
		),
	);
};
