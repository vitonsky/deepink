import { createEvent, createStore } from 'effector';

import { ITag } from '../Registry/Tags/Tags';

/**
 * Array of all exists tags
 */
export const $tags = createStore<ITag[]>([]);

/**
 * Event to set tags list
 */
export const tagsUpdated = createEvent<ITag[]>();
$tags.on(tagsUpdated, (_, payload) => payload);

/**
 * Fired after tags been changed and should be updated
 */
export const tagsChanged = createEvent();

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

/**
 * Id of selected tag to filter notes
 */
export const $activeTag = createStore<string | null>(null);

export const setActiveTag = createEvent<string | null>();
$activeTag.on(setActiveTag, (_, activeTag) => activeTag);

// Reset selected tag by remove tag
$activeTag.on($tags, (activeTag, tags) => {
	const isActiveTagExists = tags.some(({ id }) => id === activeTag);
	return isActiveTagExists ? activeTag : null;
});
