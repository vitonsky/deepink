import React, { createContext, FC } from 'react';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { INotesController } from '@core/features/notes/controller';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { SQLiteDatabase } from '@core/storage/database/SQLiteDatabase/SQLiteDatabase';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export type FileId = string;

// TODO: remove DB from app context. We should never use DB directly, only business entities instead
export const dbContext = createContext<SQLiteDatabase | null>(null);
export const useDb = createContextGetterHook(dbContext);

export const filesRegistryContext = createContext<FilesController | null>(null);
export const useFilesRegistry = createContextGetterHook(filesRegistryContext);

export const attachmentsControllerContext = createContext<AttachmentsController | null>(
	null,
);
export const useAttachmentsController = createContextGetterHook(
	attachmentsControllerContext,
);

export const tagsRegistryContext = createContext<TagsController | null>(null);
export const useTagsRegistry = createContextGetterHook(tagsRegistryContext);

export const notesRegistryContext = createContext<INotesController | null>(null);
export const useNotesRegistry = createContextGetterHook(notesRegistryContext);

export type ProvidedAppContext = {
	db: SQLiteDatabase;
	filesRegistry: FilesController;
	attachmentsController: AttachmentsController;
	tagsRegistry: TagsController;
	notesRegistry: INotesController;
};

type ProvidersProps = ProvidedAppContext & {
	children: React.ReactNode;
};

export const Providers: FC<ProvidersProps> = ({
	children,
	filesRegistry,
	attachmentsController,
	tagsRegistry,
	notesRegistry,
	db,
}) => {
	return (
		<dbContext.Provider value={db}>
			<filesRegistryContext.Provider value={filesRegistry}>
				<attachmentsControllerContext.Provider value={attachmentsController}>
					<tagsRegistryContext.Provider value={tagsRegistry}>
						<notesRegistryContext.Provider value={notesRegistry}>
							{children}
						</notesRegistryContext.Provider>
					</tagsRegistryContext.Provider>
				</attachmentsControllerContext.Provider>
			</filesRegistryContext.Provider>
		</dbContext.Provider>
	);
};
