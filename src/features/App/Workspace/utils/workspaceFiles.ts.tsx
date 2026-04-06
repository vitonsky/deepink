import { IFilesStorage } from '@core/features/files';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { WorkspaceConfigScheme } from '@state/redux/profiles/profiles';
import { WorkspaceStateScheme } from '@state/redux/profiles/selectors/selectWorkspaceState';

export const createWorkspaceStateFile = (storage: IFilesStorage) =>
	new StateFile(new FileController(`state.json`, storage), WorkspaceStateScheme);

export const createWorkspaceConfigFile = (storage: IFilesStorage) =>
	new StateFile(new FileController(`config.json`, storage), WorkspaceConfigScheme);
