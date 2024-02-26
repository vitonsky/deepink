import React, { FC, PropsWithChildren } from 'react';
import { NotesApi, notesContext } from '@state/notes';
import { TagsApi, tagsContext } from '@state/tags';
import { WorkspaceApi, workspaceContext } from '@state/workspace';

export interface WorkspaceProviderProps extends PropsWithChildren {
	workspaceApi: WorkspaceApi;
	notesApi: NotesApi;
	tagsApi: TagsApi;
}

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
