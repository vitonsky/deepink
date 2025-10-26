// for handle large negative offsets, we need to use the module formula, otherwise we would get a negative index
// formula ensures that the result is always in the range [0, collection.length - 1]
const mathModule = (n: number, m: number) => ((n % m) + m) % m;

/**
 * Returns the item at the given offset in the collection.
 * Loops through the collection in a circular way.
 */
export const getItemByOffset = <T>(collection: T[], index: number, offset: number) => {
	if (!collection.length || index >= collection.length) return null;

	const nextIndex = mathModule(index + offset, collection.length);
	return collection[nextIndex];
};
