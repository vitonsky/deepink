import React, { createContext, FC, useContext } from 'react';

import { Attachments } from '../../core/Registry/Attachments/Attachments';
import { FilesRegistry } from '../../core/Registry/FilesRegistry/FilesRegistry';
import { Tags } from '../../core/Registry/Tags/Tags';

export type FileId = string;

export const filesRegistryContext = createContext<FilesRegistry>(null as any);
export const useFilesRegistry = () => {
	return useContext(filesRegistryContext);
};

export const attachmentsRegistryContext = createContext<Attachments>(null as any);
export const useAttachmentsRegistry = () => {
	return useContext(attachmentsRegistryContext);
};

export const tagsRegistryContext = createContext<Tags>(null as any);
export const useTagsRegistry = () => {
	return useContext(tagsRegistryContext);
};

type ProvidersProps = {
	children: React.ReactNode;
	filesRegistry: FilesRegistry;
	attachmentsRegistry: Attachments;
	tagsRegistry: Tags;
};

export const Providers: FC<ProvidersProps> = ({ children, filesRegistry, attachmentsRegistry, tagsRegistry }) => {
	return (
		<filesRegistryContext.Provider value={filesRegistry}>
			<attachmentsRegistryContext.Provider value={attachmentsRegistry}>
				<tagsRegistryContext.Provider value={tagsRegistry}>
					{children}
				</tagsRegistryContext.Provider>
			</attachmentsRegistryContext.Provider>
		</filesRegistryContext.Provider>
	);
};
