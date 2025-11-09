import { IResolvedTag } from '..';

export const validateTagName = (tag: string) => {
	if (tag.length === 0) {
		throw new Error('Name must not be empty');
	}
	if (tag.startsWith('/') || tag.endsWith('/')) {
		throw new Error('Tag cannot start or end with "/"');
	}
	if (tag.split('/').some((s) => s.trim() === '')) {
		throw new Error('Tag contains an empty segment');
	}
};

export const checkTagUniqueness = (
	name: string,
	parent: string | null,
	tagsList: IResolvedTag[],
) => {
	const parentTag = tagsList.find(({ id }) => id === parent);
	const fullName = [parentTag?.resolvedName, name].filter(Boolean).join('/');

	const duplicate = tagsList.find(
		(tag) => tag.parent === parent && tag.resolvedName === fullName,
	);
	if (duplicate) {
		throw new Error(`Tag "${fullName}" already exists`);
	}
};
