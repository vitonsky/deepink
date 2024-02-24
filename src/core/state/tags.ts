import { createEvent } from 'effector';

// TODO: move to some API
/**
 * Fired after tag been attached/detached
 */
export const tagAttachmentsChanged = createEvent<
	{
		target: string;
		tagId: string;
		state: 'add' | 'delete';
	}[]
>();
