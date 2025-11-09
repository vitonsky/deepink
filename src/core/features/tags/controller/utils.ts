import { IResolvedTag } from '..';

export const validateTagName = (tag: string) => {
	if (tag.length === 0) {
		return { valid: false, message: 'Name must not be empty' };
	}
	if (tag.startsWith('/') || tag.endsWith('/')) {
		return { valid: false, message: 'Tag cannot start or end with "/"' };
	}
	if (tag.split('/').some((s) => s.trim() === '')) {
		return { valid: false, message: 'Tag contains an empty segment' };
	}

	return { valid: true };
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
		return { valid: false, message: `Tag "${fullName}" already exists` };
	}
	return { valid: true };
};
