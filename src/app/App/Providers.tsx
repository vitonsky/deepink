import React, { createContext, FC, useContext } from 'react';

import { Attachments } from '../../core/Registry/Attachments/Attachments';
import { FilesRegistry } from '../../core/Registry/FilesRegistry/FilesRegistry';

export type FileId = string;

export const filesRegistryContext = createContext<FilesRegistry>(null as any);
export const useFilesRegistry = () => {
	return useContext(filesRegistryContext);
};

export const attachmentsRegistryContext = createContext<Attachments>(null as any);
export const useAttachmentsRegistry = () => {
	return useContext(attachmentsRegistryContext);
};

type ProvidersProps = {
	children: React.ReactNode;
	filesRegistry: FilesRegistry;
	attachmentsRegistry: Attachments;
};

export const Providers: FC<ProvidersProps> = ({ children, filesRegistry, attachmentsRegistry }) => {
	return (
		<filesRegistryContext.Provider value={filesRegistry}>
			<attachmentsRegistryContext.Provider value={attachmentsRegistry}>
				{children}
			</attachmentsRegistryContext.Provider>
		</filesRegistryContext.Provider>
	);
};
