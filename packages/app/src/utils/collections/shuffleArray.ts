/**
 * Shuffle items in array and returns the same array
 * This function mutates the original array
 */
export const shuffleArray = <T extends any[]>(array: T): T => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}

	return array;
};
