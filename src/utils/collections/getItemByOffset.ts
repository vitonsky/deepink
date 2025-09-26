/**
 * Returns the item in the collection at the given offset from the index
 *
 * Returns the first item when going past the end, and the last item when going before the start
 */
export const getItemByOffset = <T>(collection: T[], index: number, offset: number) => {
	if (collection.length <= 2 || index >= collection.length) return null;

	// for handle large negative offsets, we need to use the module formula, otherwise we would get a negative index
	// formula ensures that the result is always in the range [0, collection.length - 1]
	const mathModule = (n: number, m: number) => ((n % m) + m) % m;

	const nextIndex = mathModule(index + offset, collection.length);
	return collection[nextIndex];
};
