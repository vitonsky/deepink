/**
 * Util to get unique names
 *
 * In case a names collision occurs, it generates unique id and pass it to `getName` to build unique name
 *
 * @param getName Function to get name. Unique ID is provided in case of names collision
 * @returns
 */
export const uniqueName = <T extends unknown>(
	getName: (context: T, uniqueId?: string) => string,
) => {
	const pathsCount: Record<string, number> = {};

	return (context: T) => {
		const originalName = getName(context);
		const originalNameUseCount = pathsCount[originalName] ?? 0;

		// Return original name
		if (originalNameUseCount === 0) {
			pathsCount[originalName] = originalNameUseCount + 1;
			return originalName;
		}

		for (let i = 0; i < 100; i++) {
			const suggestedName = getName(context, String(originalNameUseCount + i));

			const nameUseCount = pathsCount[suggestedName] ?? 0;
			if (nameUseCount > 0) continue;

			pathsCount[suggestedName] = nameUseCount + 1;
			pathsCount[originalName] = originalNameUseCount + i;
			return suggestedName;
		}

		throw new Error('Too deep recursion');
	};
};
