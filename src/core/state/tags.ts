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