import React, { createContext, FC, PropsWithChildren } from 'react';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { INotesController } from '@core/features/notes/controller';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { NotesApi } from '@state/notes';
import { TagsApi } from '@state/tags';
import { WorkspaceApi } from '@state/workspace';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export interface WorkspaceProviderProps extends PropsWithChildren {
	workspaceApi: WorkspaceApi;
	notesApi: NotesApi;
	tagsApi: TagsApi;

	filesRegistry: FilesController;
	attachmentsController: AttachmentsController;
	tagsRegistry: TagsController;
	notesRegistry: INotesController;
}

export const workspaceContext = createContext<WorkspaceApi | null>(null);
export const useWorkspaceContext = createContextGetterHook(workspaceContext);

export const notesContext = createContext<NotesApi | null>(null);
export const useNotesContext = createContextGetterHook(notesContext);

export const tagsContext = createContext<TagsApi | null>(null);
export const useTagsContext = createContextGetterHook(tagsContext);

export const notesRegistryContext = createContext<INotesController | null>(null);
export const useNotesRegistry = createContextGetterHook(notesRegistryContext);

export const tagsRegistryContext = createContext<TagsController | null>(null);
export const useTagsRegistry = createContextGetterHook(tagsRegistryContext);

export const attachmentsControllerContext = createContext<AttachmentsController | null>(
	null,
);
export const useAttachmentsController = createContextGetterHook(
	attachmentsControllerContext,
);

export const filesRegistryContext = createContext<FilesController | null>(null);
export const useFilesRegistry = createContextGetterHook(filesRegistryContext);

export const WorkspaceProvider: FC<WorkspaceProviderProps> = ({
	workspaceApi,
	notesApi,
	tagsApi,
	filesRegistry,
	attachmentsController,
	tagsRegistry,
	notesRegistry,
	children,
}) => {
	return (
		<workspaceContext.Provider value={workspaceApi}>
			<notesContext.Provider value={notesApi}>
				<tagsContext.Provider value={tagsApi}>
					<filesRegistryContext.Provider value={filesRegistry}>
						<attachmentsControllerContext.Provider
							value={attachmentsController}
						>
							<tagsRegistryContext.Provider value={tagsRegistry}>
								<notesRegistryContext.Provider value={notesRegistry}>
									{children}
								</notesRegistryContext.Provider>
							</tagsRegistryContext.Provider>
						</attachmentsControllerContext.Provider>
					</filesRegistryContext.Provider>
				</tagsContext.Provider>
			</notesContext.Provider>
		</workspaceContext.Provider>
	);
};
