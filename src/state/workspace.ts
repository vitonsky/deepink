import { createContext } from 'react';
import { createEvent } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const createWorkspaceApi = () => {
	const events = {
		tagsUpdateRequested: createEvent(),
		tagAttachmentsChanged: createEvent<
			{
				target: string;
				tagId: string;
				state: 'add' | 'delete';
			}[]
		>(),
	};

	return {
		events,
	};
};

export type WorkspaceApi = ReturnType<typeof createWorkspaceApi>;

export const workspaceContext = createContext<WorkspaceApi | null>(null);

export const useWorkspaceContext = createContextGetterHook(workspaceContext);
