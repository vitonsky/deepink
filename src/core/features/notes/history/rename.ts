/**
 * Return mapper function that receive original object and returns new object with renamed fields according to names map
 *
 * For type safe use it's necessary to use `as const` like that `rename({ created_at: 'createdAt' } as const)`
 */
export const rename =
	<M extends Record<string, string>>(map: M) =>
	<T extends Record<string, any>>(
		input: keyof M extends keyof T ? T : never,
	): {
		[K in keyof T as K extends keyof M ? M[K] : K]: T[K];
	} => {
		const result: Record<string, any> = {};
		for (const [key, value] of Object.entries(input)) {
			result[map[key] ?? key] = value;
		}

		return result as any;
	};
