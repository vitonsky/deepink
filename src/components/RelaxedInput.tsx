import React from 'react';
import { Input, InputProps } from '@chakra-ui/react';
import { useRelaxedValue } from '@hooks/useRelaxedValue';

export const RelaxedInput = ({
	value,
	onValueChange,
	onChange,
	wait = 500,
	...props
}: InputProps & { wait?: number; onValueChange?: (value: string) => void }) => {
	const [state, setState] = useRelaxedValue<string>({
		value: String(value ?? ''),
		onChange(value) {
			onValueChange?.(value);
		},
		wait,
	});

	return (
		<Input
			{...props}
			value={state}
			onChange={(evt) => {
				setState(evt.target.value);
			}}
		/>
	);
};
