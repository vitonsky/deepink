import { TagItem } from '@features/MainScreen/TagsPanel/TagsList';

import { createWorkspaceSelector, selectWorkspaceRoot } from '../utils';

export const selectActiveTag = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return null;

		const currentTag = workspace.tags.selected;
		if (!currentTag) return null;

		return workspace.tags.list.find((tag) => tag.id === currentTag) ?? null;
	},
);

export const selectTags = createWorkspaceSelector([selectWorkspaceRoot], (workspace) => {
	if (!workspace) return [];

	return workspace.tags.list;
});

export const selectTagsTree = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return [];

		const flatTags = workspace.tags.list;

		const tagsMap: Record<string, TagItem> = {};
		const tagToParentMap: Record<string, string> = {};

		// Fill maps
		flatTags.forEach(({ id, name, parent }) => {
			tagsMap[id] = {
				id,
				content: name,
			};

			if (parent !== null) {
				tagToParentMap[id] = parent;
			}
		});

		// Attach tags to parents
		for (const tagId in tagToParentMap) {
			const parentId = tagToParentMap[tagId];

			const tag = tagsMap[tagId];
			const parentTag = tagsMap[parentId];

			// Create array
			if (!parentTag.childrens) {
				parentTag.childrens = [];
			}

			// Attach tag to another tag
			parentTag.childrens.push(tag);
		}

		// Delete nested tags from tags map
		Object.keys(tagToParentMap).forEach((nestedTagId) => {
			delete tagsMap[nestedTagId];
		});

		// Collect tags array from a map
		return Object.values(tagsMap);
	},
);
