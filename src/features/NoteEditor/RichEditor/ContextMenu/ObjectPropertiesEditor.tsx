import * as React from 'react';
import { useEffect } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { useForm } from 'react-hook-form';
import { FaXmark } from 'react-icons/fa6';
import { isEqual } from 'lodash';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	FocusLock,
	HStack,
	Input,
	Text,
	VStack,
} from '@chakra-ui/react';

export type OptionObject = {
	id: string;
	value: string;
	label: string;
};

export type PropertiesFormProps<T extends OptionObject[]> = {
	options: T;
	onUpdate: (values: {
		[K in T[number]['value']]: string;
	}) => void;
	onCancel?: () => void;
};

export const PropertiesForm = <T extends OptionObject[]>({
	options,
	onUpdate,
	onCancel,
}: PropertiesFormProps<T>) => {
	const optionsValues = Object.fromEntries(options.map(({ id, value }) => [id, value]));
	const { register, getValues, setValue, reset } = useForm({
		defaultValues: optionsValues,
	});

	useEffect(() => {
		if (isEqual(optionsValues, getValues())) return;

		reset(optionsValues);
	}, [getValues, optionsValues, reset, setValue]);

	return (
		<VStack as="form" gap="1rem">
			<VStack w="100%" gap="0.5rem">
				{options.map(({ id, label }) => {
					return <Input key={id} placeholder={label} {...register(id)} />;
				})}
			</VStack>

			<HStack w="100%" justifyContent="end">
				{onCancel && <Button onClick={onCancel}>Cancel</Button>}
				<Button
					variant="primary"
					onClick={() => {
						onUpdate(getValues() as any);
					}}
				>
					Save
				</Button>
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
