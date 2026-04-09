import { IFilesStorage } from '@core/features/files';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { WorkspaceStateScheme } from '@features/App/Workspace/services/workspaceState';
import { WorkspaceConfigScheme } from '@state/redux/profiles/profiles';

export const createWorkspaceStateFile = (storage: IFilesStorage) =>
	new StateFile(new FileController(`state.json`, storage), WorkspaceStateScheme);

export const createWorkspaceConfigFile = (storage: IFilesStorage) =>
	new StateFile(new FileController(`config.json`, storage), WorkspaceConfigScheme);
