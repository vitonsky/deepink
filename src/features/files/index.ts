import { createContext, useContext, useMemo } from 'react';
import { IFilesStorage } from '@core/features/files';
import { RootedFS } from '@core/features/files/RootedFS';
import { getResolvedPath } from '@utils/fs/paths';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const FilesStorageContext = createContext<IFilesStorage | null>(null);
export const useFilesStorage = createContextGetterHook(FilesStorageContext);

export const VaultStorage = createContext<IFilesStorage | null>(null);
export const useVaultStorage = (root?: string) => {
	const storage = useContext(VaultStorage);
	if (!storage) throw new Error('Vault storage is not provided');

	return useMemo(
		() => new RootedFS(storage, root ? getResolvedPath(root, '/') : '/'),
		[root, storage],
	);
};
