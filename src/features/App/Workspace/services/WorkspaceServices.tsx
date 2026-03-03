import { useLexemesRegistryPrune } from './useLexemesRegistryPrune';
import { useWorkspaceConfigSync } from './useWorkspaceConfigSync';

export const WorkspaceServices = () => {
	useLexemesRegistryPrune();

	useWorkspaceConfigSync();

	return null;
};
