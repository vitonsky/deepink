import React, { createContext, FC, PropsWithChildren } from 'react';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { INote } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export type NotesApi = {
	openNote: (note: INote, focus?: boolean) => void;
	noteUpdated: (note: INote) => void;
	noteClosed: (noteId: string) => void;
};
export const NotesContext = createContext<NotesApi | null>(null);
export const useNotesContext = createContextGetterHook(NotesContext);

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
	notesApi: NotesApi;

	filesRegistry: FilesController;
	attachmentsController: AttachmentsController;
	tagsRegistry: TagsController;
	notesRegistry: INotesController;
}

export const WorkspaceProvider: FC<WorkspaceProviderProps> = ({
	notesApi,
	filesRegistry,
	attachmentsController,
	tagsRegistry,
	notesRegistry,
	children,
}) => {
	return (
		<NotesContext.Provider value={notesApi}>
			<FilesRegistryContext.Provider value={filesRegistry}>
				<AttachmentsControllerContext.Provider value={attachmentsController}>
					<TagsRegistryContext.Provider value={tagsRegistry}>
						<NotesRegistryContext.Provider value={notesRegistry}>
							{children}
						</NotesRegistryContext.Provider>
					</TagsRegistryContext.Provider>
				</AttachmentsControllerContext.Provider>
			</FilesRegistryContext.Provider>
		</NotesContext.Provider>
	);
};
