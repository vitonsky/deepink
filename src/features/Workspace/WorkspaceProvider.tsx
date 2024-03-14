import React, { createContext, FC, PropsWithChildren } from 'react';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { INotesController } from '@core/features/notes/controller';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { NotesApi } from '@state/notes';
import { TagsApi } from '@state/tags';
import { WorkspaceApi } from '@state/workspace';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const WorkspaceContext = createContext<WorkspaceApi | null>(null);
export const useWorkspaceContext = createContextGetterHook(WorkspaceContext);

export const NotesContext = createContext<NotesApi | null>(null);
export const useNotesContext = createContextGetterHook(NotesContext);

export const TagsContext = createContext<TagsApi | null>(null);
export const useTagsContext = createContextGetterHook(TagsContext);

export const NotesRegistryContext = createContext<INotesController | null>(null);
export const useNotesRegistry = createContextGetterHook(NotesRegistryContext);

export const TagsRegistryContext = createContext<TagsController | null>(null);
export const useTagsRegistry = createContextGetterHook(TagsRegistryContext);

export const AttachmentsControllerContext = createContext<AttachmentsController | null>(
	null,
);
export const useAttachmentsController = createContextGetterHook(
	AttachmentsControllerContext,
);

export const FilesRegistryContext = createContext<FilesController | null>(null);
export const useFilesRegistry = createContextGetterHook(FilesRegistryContext);

export interface WorkspaceProviderProps extends PropsWithChildren {
	workspaceApi: WorkspaceApi;
	notesApi: NotesApi;
	tagsApi: TagsApi;

	filesRegistry: FilesController;
	attachmentsController: AttachmentsController;
	tagsRegistry: TagsController;
	notesRegistry: INotesController;
}

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
		<WorkspaceContext.Provider value={workspaceApi}>
			<NotesContext.Provider value={notesApi}>
				<TagsContext.Provider value={tagsApi}>
					<FilesRegistryContext.Provider value={filesRegistry}>
						<AttachmentsControllerContext.Provider
							value={attachmentsController}
						>
							<TagsRegistryContext.Provider value={tagsRegistry}>
								<NotesRegistryContext.Provider value={notesRegistry}>
									{children}
								</NotesRegistryContext.Provider>
							</TagsRegistryContext.Provider>
						</AttachmentsControllerContext.Provider>
					</FilesRegistryContext.Provider>
				</TagsContext.Provider>
			</NotesContext.Provider>
		</WorkspaceContext.Provider>
	);
};
