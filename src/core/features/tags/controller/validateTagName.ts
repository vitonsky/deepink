import { IResolvedTag } from '..';

export enum TAG_ERROR_CODE {
	NOT_UNIQUE = 'notUnique',
	EMPTY = 'empty',
	BOUNDARY_SLASH = 'invalidBoundarySlash',
	MULTIPLE_SLASHES = 'multipleConsecutiveSlashes',
}

export class TagError extends Error {
	constructor(message: string, public readonly code: TAG_ERROR_CODE) {
		super(message);
		this.name = this.constructor.name;
	}
}

export const validateTagName = (
	name: string,
	parent: string | null,
	tagsList: IResolvedTag[],
) => {
	if (name.length === 0) {
		throw new TagError('Tag name must not be empty', TAG_ERROR_CODE.EMPTY);
	}
	if (name.startsWith('/') || name.endsWith('/')) {
		throw new TagError(
			'Tag name must not start or end with a slash "/"',
			TAG_ERROR_CODE.BOUNDARY_SLASH,
		);
	}
	if (name.includes('//')) {
		throw new TagError(
			'Tag name must not contain consecutive slashes "//"',
			TAG_ERROR_CODE.MULTIPLE_SLASHES,
		);
	}

	// check tag uniqueness
	const parentTag = tagsList.find(({ id }) => id === parent);
	const fullName = [parentTag?.resolvedName, name].filter(Boolean).join('/');

	const duplicate = tagsList.find(
		(tag) => tag.parent === parent && tag.resolvedName === fullName,
	);
	if (duplicate) {
		throw new TagError(
			`Tag "${fullName}" already exists under the specified parent`,
			TAG_ERROR_CODE.NOT_UNIQUE,
		);
	}
};
