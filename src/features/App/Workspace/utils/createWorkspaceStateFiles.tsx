import { IFilesStorage } from '@core/features/files';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { WorkspaceConfigScheme } from '@state/redux/profiles/profiles';
import { WorkspaceStateScheme } from '@state/redux/profiles/selectors/selectWorkspaceState';

export const createWorkspaceStateFiles = (storage: IFilesStorage) => ({
	workspaceConfig: new StateFile(
		new FileController(`config.json`, storage),
		WorkspaceConfigScheme,
	),
	workspaceState: new StateFile(
		new FileController(`state.json`, storage),
		WorkspaceStateScheme,
	),
});
