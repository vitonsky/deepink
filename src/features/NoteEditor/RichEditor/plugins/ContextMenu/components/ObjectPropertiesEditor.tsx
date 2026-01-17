import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { useForm } from 'react-hook-form';
import { FaXmark } from 'react-icons/fa6';
import { isEqual } from 'lodash';
import { z } from 'zod';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	FocusLock,
	HStack,
	Input,
	StackProps,
	Text,
	VStack,
} from '@chakra-ui/react';
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
	onUpdate: (values: {
		[K in T[number]['value']]: string;
	}) => void;
	onCancel?: () => void;
	submitButtonText?: string;
	cancelButtonText?: string;
};

export const PropertiesForm = <T extends OptionObject[]>({
	options,
	validatorScheme,
	onUpdate,
	onCancel,
	submitButtonText = 'Save',
	cancelButtonText = 'Cancel',
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
		if (isEqual(optionsValues, getValues())) return;

		reset(optionsValues);
	}, [getValues, optionsValues, reset, setValue]);

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
							{<Text paddingBottom=".2rem">{label}</Text>}
							<Input {...register(id)} placeholder={placeholder} />
							{error && <Text color="message.error">{error.message}</Text>}
						</VStack>
					);
				})}
			</VStack>

			<HStack w="100%" justifyContent="end">
				<Button variant="accent" type="submit">
					{submitButtonText}
				</Button>
				{onCancel && <Button onClick={onCancel}>{cancelButtonText}</Button>}
			</HStack>
		</VStack>
	);
};

export type ObjectPropertiesEditor<T extends OptionObject[]> = Omit<
	PropertiesFormProps<T>,
	'onCancel'
> & {
	title: string;
	onClose?: () => void;
};

export const ObjectPropertiesEditor = <T extends OptionObject[]>({
	title,
	onClose,
	...rest
}: ObjectPropertiesEditor<T>) => {
	return (
		<FocusLock>
			<Card sx={{ backgroundColor: 'surface.background' }} boxShadow="outline">
				<CardHeader
					display="flex"
					padding="1rem"
					justifyContent="space-between"
					alignItems="baseline"
					fontWeight="bold"
				>
					<Text>{title}</Text>
					{onClose && (
						<HStack marginLeft="1rem">
							<Button size="sm" onClick={onClose}>
								<FaXmark />
							</Button>
						</HStack>
					)}
				</CardHeader>
				<CardBody padding="1rem">
					<AutoFocusInside>
						<PropertiesForm {...rest} onCancel={onClose} />
					</AutoFocusInside>
				</CardBody>
			</Card>
		</FocusLock>
	);
};
