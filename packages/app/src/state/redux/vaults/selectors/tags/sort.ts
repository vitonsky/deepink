import { TagNode } from './types';

export const sortTagsLexicographically = (a: TagNode, b: TagNode) => {
	const nameOrder = a.name.localeCompare(b.name);
	if (nameOrder !== 0) return nameOrder;

	return a.id.localeCompare(b.id);
};
