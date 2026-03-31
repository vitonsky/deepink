import { useEffect } from 'react';
import z from 'zod';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { NOTES_VIEW } from '@state/redux/profiles/profiles';
import { selectWorkspaceState } from '@state/redux/profiles/selectors/selectWorkspaceState';
import { selectIsWorkspaceLoaded } from '@state/redux/profiles/selectors/workspaceLoadingStatus';
import { createAppSelector } from '@state/redux/utils';

import { createWorkspaceStateFiles } from '../utils/createWorkspaceStateFiles';

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

	const isWorkspaceRestored = useWorkspaceSelector(selectIsWorkspaceLoaded);
	const workspaceStorage = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));
	useEffect(() => {
		if (!isWorkspaceRestored) return;

		const { workspaceState } = createWorkspaceStateFiles(workspaceStorage);

		return watchSelector({
			selector: createAppSelector(selectWorkspaceState(workspaceData), (state) => {
				if (!state) return null;

				return state;
			}),
			onChange(state) {
				if (!state) return;

				workspaceState.set(state);
			},
		});
	}, [isWorkspaceRestored, watchSelector, workspaceData, workspaceStorage]);
};
