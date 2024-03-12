import React, { createContext, FC, PropsWithChildren } from 'react';
import { NotesApi } from '@state/notes';
import { TagsApi } from '@state/tags';
import { WorkspaceApi } from '@state/workspace';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export interface WorkspaceProviderProps extends PropsWithChildren {
	workspaceApi: WorkspaceApi;
	notesApi: NotesApi;
	tagsApi: TagsApi;
}

export const workspaceContext = createContext<WorkspaceApi | null>(null);
export const useWorkspaceContext = createContextGetterHook(workspaceContext);

export const notesContext = createContext<NotesApi | null>(null);
export const useNotesContext = createContextGetterHook(notesContext);

export const tagsContext = createContext<TagsApi | null>(null);
export const useTagsContext = createContextGetterHook(tagsContext);

export const WorkspaceProvider: FC<WorkspaceProviderProps> = ({
	workspaceApi,
	notesApi,
	tagsApi,
	children,
}) => {
	return (
		<workspaceContext.Provider value={workspaceApi}>
			<notesContext.Provider value={notesApi}>
				<tagsContext.Provider value={tagsApi}>{children}</tagsContext.Provider>
			</notesContext.Provider>
		</workspaceContext.Provider>
	);
};
