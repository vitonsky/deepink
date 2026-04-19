export const isDictionaryValue = <T extends Record<any, any>>(
	dictionary: T,
	value: unknown,
): value is T[keyof T] => Object.values(dictionary).includes(value);
