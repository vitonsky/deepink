import { IResolvedTag } from '.';

// TODO: remove unused code
export const isTagsArray = (data: unknown): data is string[] =>
	Array.isArray(data) && data.every((item) => typeof item === 'string');

export const findParentTag = (resolvedTagName: string, tags: IResolvedTag[]) => {
	const tagSegments = resolvedTagName.split('/');

	let parent: IResolvedTag | null = null;
	for (const tag of tags) {
		const currentTagSegments = tag.resolvedName.split('/');
		const isCompleteSubTag =
			currentTagSegments.length < tagSegments.length &&
			currentTagSegments.every((segment, index) => tagSegments[index] === segment);

		if (!isCompleteSubTag) continue;

		// Remember only those parent who have more segments
		if (parent === null || parent.resolvedName.length < tag.resolvedName.length) {
			parent = tag;
		}
	}

	return parent;
};
