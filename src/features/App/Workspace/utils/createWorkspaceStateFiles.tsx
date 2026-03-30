import { FileController } from '@core/features/files/FileController';
import { RootedFS } from '@core/features/files/RootedFS';
import { StateFile } from '@core/features/files/StateFile';
import { WorkspaceConfigScheme } from '@state/redux/profiles/profiles';

import { WorkspaceStateScheme } from '../services/useWorkspaceStateSync';

export const createWorkspaceStateFiles = (storage: RootedFS) => ({
	workspaceConfig: new StateFile(
		new FileController(`config.json`, storage),
		WorkspaceConfigScheme,
	),
	workspaceState: new StateFile(
		new FileController(`state.json`, storage),
		WorkspaceStateScheme,
	),
});
