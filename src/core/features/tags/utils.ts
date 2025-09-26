import { IResolvedTag } from '.';

// TODO: remove unused code
export const isTagsArray = (data: unknown): data is string[] =>
	Array.isArray(data) && data.every((item) => typeof item === 'string');

export const findParentTag = (resolvedTagName: string, tags: IResolvedTag[]) => {
	let parent: IResolvedTag | null = null;
	for (const tag of tags) {
		if (!resolvedTagName.startsWith(tag.resolvedName)) continue;

		// Remember only those parent who have more segments
		if (parent === null || parent.resolvedName.length < tag.resolvedName.length) {
			parent = tag;
		}
	}

	return parent;
};
