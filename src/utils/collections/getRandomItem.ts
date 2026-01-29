export const getRandomItem = <T>(collection: T[]) => {
	return collection[Math.floor(Math.random() * collection.length)];
};
