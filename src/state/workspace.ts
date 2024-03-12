import { createEvent } from 'effector';

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
