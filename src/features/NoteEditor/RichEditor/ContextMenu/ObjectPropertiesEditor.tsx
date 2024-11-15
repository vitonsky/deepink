import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Button, HStack, Input, VStack } from '@chakra-ui/react';

type OptionObject = {
	id: string;
	value: string;
	label: string;
};

export const ObjectPropertiesEditor = <T extends OptionObject[]>({
	options,
	onUpdate,
}: {
	options: T;
	onUpdate: (values: {
		[K in T[number]['value']]: string;
	}) => void;
}) => {
	const { register, getValues } = useForm({
		defaultValues: Object.fromEntries(options.map(({ id, value }) => [id, value])),
	});

	return (
		<VStack as="form" gap="1rem">
			<VStack w="100%" gap="0.5rem">
				{options.map(({ id, label }) => {
					return <Input key={id} placeholder={label} {...register(id)} />;
				})}
			</VStack>

			<HStack w="100%" justifyContent="end">
				<Button
					onClick={() => {
						onUpdate(getValues() as any);
					}}
				>
					Update
				</Button>
			</HStack>
		</VStack>
	);
};
