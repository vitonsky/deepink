export type TestValueCreatorConfig = {
	/**
	 * A hook that will be called to create context.
	 * Useful to define stage when context must be created.
	 *
	 * For example it may be `beforeAll`, `beforeEach`, etc.
	 */
	hook?: (callback: () => Promise<void>) => void;
};

const EmptyValue = Symbol();

/**
 * Create a context that will available while test run,
 * and return a hook to get that context during test.
 *
 * The purpose of that hook is to manage context out of test,
 * i.e. manage database, etc.
 *
 * @param creator callback that creates and return a value
 */
export const createTestContext = <T extends unknown>(
	creator: () => T | Promise<T>,
	{ hook = beforeAll }: TestValueCreatorConfig = {},
) => {
	const ref: { value: T } = { value: EmptyValue as any };
	hook(async () => {
		const result = await creator();
		ref.value = result;
	});

	return () => {
		if (ref.value === EmptyValue)
			throw new Error('The test value have not been initialized');
		return ref.value;
	};
};
