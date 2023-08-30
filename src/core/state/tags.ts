import { createEvent, createStore } from "effector";

import { ITag } from "../Registry/Tags/Tags";

export const $tags = createStore<ITag[]>([]);
export const tagsUpdated = createEvent<ITag[]>();
export const tagsChanged = createEvent();

$tags.on(tagsUpdated, (_, payload) => payload);

export const tagAttachmentChanged = createEvent<{
	target: string;
	tagId: string;
	state: 'add' | 'delete'
}>();

export const $activeTag = createStore<string | null>(null);
export const setActiveTag = createEvent<string | null>();

$activeTag.on(setActiveTag, (_, activeTag) => activeTag);
$activeTag.on($tags, (activeTag, tags) => {
	const isActiveTagExists = tags.some(({ id }) => id === activeTag);
	return isActiveTagExists ? activeTag : null;
});