import { createContext } from 'react';
import { createEvent, createStore, sample } from 'effector';
import { IResolvedTag } from '@core/features/tags';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

// TODO: add tests
export const createTagsApi = () => {
	const $tags = createStore<{
		selected: string | null;
		list: IResolvedTag[];
	}>({
		selected: null,
		list: [],
	});

	const events = {
		selectedTagChanged: createEvent<string | null>(),
		tagsUpdated: createEvent<IResolvedTag[]>(),
	};

	// Update tags
	sample({
		clock: events.tagsUpdated,
		source: $tags,
		fn(state, tags) {
			return {
				...state,
				selected:
					state.selected !== null &&
					tags.some(({ id }) => id === state.selected)
						? state.selected
						: null,
				list: tags,
			};
		},
		target: $tags,
	});

	// Select tag
	$tags.on(events.selectedTagChanged, (state, selectedTag) => {
		return {
			...state,
			selected:
				selectedTag !== null && state.list.some(({ id }) => id === selectedTag)
					? selectedTag
					: null,
		};
	});

	return {
		$tags,
		events,
	};
};

export type TagsApi = ReturnType<typeof createTagsApi>;

export const tagsContext = createContext<TagsApi | null>(null);

export const useTagsContext = createContextGetterHook(tagsContext);
