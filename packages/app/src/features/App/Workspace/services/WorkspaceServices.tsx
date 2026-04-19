import { useWorkspaceConfigSync } from './useWorkspaceConfigSync';
import { useWorkspaceStateSync } from './useWorkspaceStateSync';

export const WorkspaceServices = () => {
	useWorkspaceConfigSync();
	useWorkspaceStateSync();

	return null;
};
