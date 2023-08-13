import { createEvent, createStore } from 'effector';

export const $activeTag = createStore<string | null>(null);

export const setActiveTag = createEvent<string | null>();
$activeTag.on(setActiveTag, (_, activeTag) => activeTag);