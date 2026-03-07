import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { isEqual } from 'lodash';
import z from 'zod';
import { Button, HStack, Input, StackProps, Text, VStack } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';

export type OptionObject = {
	id: string;
	value: string;
	label: string;
	placeholder?: string;
};

export type PropertiesFormProps<T extends OptionObject[]> = StackProps & {
	options: T;
	validatorScheme?: z.ZodType;
	onUpdate: (values: Record<T[number]['value'], string>) => void;
	onCancel?: () => void;
	submitButtonText?: string;
	cancelButtonText?: string;
	isPending?: boolean;
};

export const PropertiesForm = <T extends OptionObject[]>({
	options,
	validatorScheme,
	onUpdate,
	onCancel,
	submitButtonText = 'Save',
	cancelButtonText = 'Cancel',
	isPending,
	...props
}: PropertiesFormProps<T>) => {
	const optionsValues = useMemo(
		() => Object.fromEntries(options.map(({ id, value }) => [id, value])),
		[options],
	);
	const {
		register,
		getValues,
		setValue,
		reset,
		handleSubmit,
		formState: { errors },
	} = useForm({
		defaultValues: optionsValues,
		resolver: validatorScheme ? zodResolver(validatorScheme) : undefined,
	});

	useEffect(() => {
		if (isPending) return;
		if (isEqual(optionsValues, getValues())) return;

		reset(optionsValues);
	}, [getValues, isPending, optionsValues, reset, setValue]);

	console.log(isPending);

	return (
		<VStack
			as="form"
			gap="1.5rem"
			w="100%"
			minW="350px"
			{...props}
			onSubmit={handleSubmit((values) => {
				onUpdate(values as any);
			})}
		>
			<VStack align="start" w="100%" gap="1rem">
				{options.map(({ id, label, placeholder }) => {
					const error = errors[id];
					return (
						<VStack key={id} as="label" align="start" w="100%" gap="0.3rem">
							<Text paddingBottom=".2rem">{label}</Text>
							<Input
								{...register(id)}
								placeholder={placeholder}
								disabled={isPending}
							/>
							{error && <Text color="message.error">{error.message}</Text>}
						</VStack>
					);
				})}
			</VStack>

			<HStack w="100%" justifyContent="end">
				<Button variant="accent" type="submit" isDisabled={isPending}>
					{submitButtonText}
				</Button>
				{onCancel && (
					<Button onClick={onCancel} isDisabled={isPending}>
						{cancelButtonText}
					</Button>
				)}
			</HStack>
		</VStack>
	);
};
