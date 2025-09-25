/**
 * Returns the item in the collection at the given offset from the index
 *
 * Returns the first item when going past the end, and the last item when going before the start
 */
export const getItemByOffset = <T>(collection: T[], index: number, offset: number) => {
	if (collection.length < 2) return null;

	const nextIndex =
		(((index + offset) % collection.length) + collection.length) % collection.length;
	return collection[nextIndex];
};
