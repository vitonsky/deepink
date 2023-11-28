import { ITag } from '../core/Registry/Tags/Tags';

export const isTagsArray = (data: unknown): data is string[] =>
	Array.isArray(data) && data.every((item) => typeof item === 'string');

export const findParentTag = (resolvedTagName: string, tags: ITag[]) => {
	let parent: ITag | null = null;
	for (const tag of tags) {
		if (!resolvedTagName.startsWith(tag.resolvedName)) continue;

		// Remember only those parent who have more segments
		if (parent === null || parent.resolvedName.length < tag.resolvedName.length) {
			parent = tag;
		}
	}

	return parent;
};
