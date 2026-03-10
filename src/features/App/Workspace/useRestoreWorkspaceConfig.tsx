import { useEffect } from 'react';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions, useWorkspaceData } from '@state/redux/profiles/hooks';
import { WorkspaceConfigScheme } from '@state/redux/profiles/profiles';

export const useRestoreWorkspaceConfig = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const workspaceActions = useWorkspaceActions();

	// Load workspace configuration
	const workspaceFiles = useVaultStorage(getWorkspacePath(workspaceData.workspaceId));
	useEffect(() => {
		const state = new StateFile(
			new FileController(`config.json`, workspaceFiles),
			WorkspaceConfigScheme,
		);

		state.get().then((workspaceConfig) => {
			if (workspaceConfig) {
				dispatch(
					workspaceActions.setWorkspaceNoteTemplateConfig({
						title: workspaceConfig.newNote.title,
						tags: workspaceConfig.newNote.tags,
					}),
				);
			}

			dispatch(
				workspaceActions.setWorkspaceLoadingStatus({
					status: {
						isConfigReady: true,
					},
				}),
			);
		});
	}, [dispatch, workspaceActions, workspaceFiles]);
};
