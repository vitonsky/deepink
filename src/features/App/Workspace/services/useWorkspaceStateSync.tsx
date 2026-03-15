import { useEffect } from 'react';
import z from 'zod';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { NOTES_VIEW, selectWorkspace } from '@state/redux/profiles/profiles';
import { selectIsWorkspaceLoaded } from '@state/redux/profiles/selectors/loadingStatus';
import { createAppSelector } from '@state/redux/utils';

export const WorkspaceStateScheme = z.object({
	openedNoteIds: z.array(z.string()).nullable(),
	activeNoteId: z.string().nullable(),
	selectedTagId: z.string().nullable(),
	view: z.enum(NOTES_VIEW),
	search: z.string(),
});

export const useWorkspaceStateSync = () => {
	const workspaceData = useWorkspaceData();
	const watchSelector = useWatchSelector();

	const isWorkspaceLoaded = useWorkspaceSelector(selectIsWorkspaceLoaded);
	const workspaceFiles = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));
	useEffect(() => {
		if (!isWorkspaceLoaded) return;

		const workspaceState = new StateFile(
			new FileController(`state.json`, workspaceFiles),
			WorkspaceStateScheme,
		);

		return watchSelector({
			selector: createAppSelector(selectWorkspace(workspaceData), (state) => {
				if (!state) return null;

				return {
					openedNoteIds: state.openedNotes.map((n) => n.id),
					activeNoteId: state.activeNote,
					selectedTagId: state.tags.selected,
					view: state.view,
					search: state.search,
				};
			}),
			onChange(state) {
				if (!state) return;

				workspaceState.set(state);
			},
		});
	}, [isWorkspaceLoaded, watchSelector, workspaceData, workspaceFiles]);
};
