import React, { createContext, FC, useContext } from 'react';

import { INotesRegistry } from '../../core/Registry';
import { Attachments } from '../../core/Registry/Attachments/Attachments';
import { FilesRegistry } from '../../core/Registry/FilesRegistry/FilesRegistry';
import { Tags } from '../../core/Registry/Tags/Tags';
import { SQLiteDb } from '../../core/storage/SQLiteDb';

export type FileId = string;

// TODO: remove DB from app context. We should never use DB directly, only business entities instead
export const dbContext = createContext<SQLiteDb>(null as any);
export const useDb = () => {
	return useContext(dbContext);
};

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

export const notesRegistryContext = createContext<INotesRegistry>(null as any);
export const useNotesRegistry = () => {
	return useContext(notesRegistryContext);
};

export type ProvidedAppContext = {
	db: SQLiteDb;
	filesRegistry: FilesRegistry;
	attachmentsRegistry: Attachments;
	tagsRegistry: Tags;
	notesRegistry: INotesRegistry;
};

type ProvidersProps = ProvidedAppContext & {
	children: React.ReactNode;
};

export const Providers: FC<ProvidersProps> = ({
	children,
	filesRegistry,
	attachmentsRegistry,
	tagsRegistry,
	notesRegistry,
	db,
}) => {
	return (
		<dbContext.Provider value={db}>
			<filesRegistryContext.Provider value={filesRegistry}>
				<attachmentsRegistryContext.Provider value={attachmentsRegistry}>
					<tagsRegistryContext.Provider value={tagsRegistry}>
						<notesRegistryContext.Provider value={notesRegistry}>
							{children}
						</notesRegistryContext.Provider>
					</tagsRegistryContext.Provider>
				</attachmentsRegistryContext.Provider>
			</filesRegistryContext.Provider>
		</dbContext.Provider>
	);
};
