import React, { createContext, FC, useContext } from 'react';

import { FilesRegistry } from '../../core/Registry/FilesRegistry/FilesRegistry';

export type FileId = string;

export const filesRegistryContext = createContext<FilesRegistry>(null as any);
export const useFilesRegistry = () => {
	return useContext(filesRegistryContext);
};

type ProvidersProps = {
	children: React.ReactNode;
	filesRegistry: FilesRegistry;
};

export const Providers: FC<ProvidersProps> = ({ children, filesRegistry }) => {
	return (
		<filesRegistryContext.Provider value={filesRegistry}>
			{children}
		</filesRegistryContext.Provider>
	);
};
