export const getRandomItem = <T>(collection: T[]) => {
	if (collection.length === 0) {
		throw new Error('Collection cannot be empty');
	}

	return collection[Math.floor(Math.random() * collection.length)];
};
