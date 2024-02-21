import React, { createContext, FC, useContext } from 'react';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { INotesController } from '@core/features/notes/controller';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { SQLiteDatabase } from '@core/storage/database/SQLiteDatabase/SQLiteDatabase';

export type FileId = string;

// TODO: remove DB from app context. We should never use DB directly, only business entities instead
export const dbContext = createContext<SQLiteDatabase>(null as any);
export const useDb = () => {
	return useContext(dbContext);
};

export const filesRegistryContext = createContext<FilesController>(null as any);
export const useFilesRegistry = () => {
	return useContext(filesRegistryContext);
};

export const attachmentsRegistryContext = createContext<AttachmentsController>(
	null as any,
);
export const useAttachmentsRegistry = () => {
	return useContext(attachmentsRegistryContext);
};

export const tagsRegistryContext = createContext<TagsController>(null as any);
export const useTagsRegistry = () => {
	return useContext(tagsRegistryContext);
};

export const notesRegistryContext = createContext<INotesController>(null as any);
export const useNotesRegistry = () => {
	return useContext(notesRegistryContext);
};

export type ProvidedAppContext = {
	db: SQLiteDatabase;
	filesRegistry: FilesController;
	attachmentsRegistry: AttachmentsController;
	tagsRegistry: TagsController;
	notesRegistry: INotesController;
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
