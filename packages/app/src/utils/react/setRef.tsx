import { Ref } from 'react';

/**
 * Set value to a ref
 * @param ref may be Object ref or a Callback ref
 * @param value value to set
 * @returns cleanup function to set empty value on ref
 */
export const setRef = <T extends unknown>(ref: Ref<T> | null, value: T) => {
	if (ref) {
		switch (typeof ref) {
			case 'function':
				ref(value);
				break;
			case 'object':
				if (ref !== null) ref.current = value;
				break;
		}
	}

	return () => {
		setRef(ref, null);
	};
};
