import { useLexemesRegistryPrune } from './useLexemesRegistryPrune';
import { useWorkspaceConfigSync } from './useWorkspaceConfigSync';
import { useWorkspaceStateSync } from './useWorkspaceStateSync';

export const WorkspaceServices = () => {
	useLexemesRegistryPrune();

	useWorkspaceConfigSync();
	useWorkspaceStateSync();

	return null;
};
