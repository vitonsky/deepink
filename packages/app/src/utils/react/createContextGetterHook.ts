import { useContext } from 'react';

export const createContextGetterHook =
	<T extends unknown>(context: React.Context<T>, errorMessage?: string) =>
	(): Exclude<T, null> => {
		const contextValue = useContext(context);
		if (contextValue === null)
			throw new TypeError(
				errorMessage ??
					`Did not provided value for context "${
						context.displayName ?? 'Unknown'
					}"`,
			);

		return contextValue as Exclude<T, null>;
	};
