import * as React from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { FaXmark } from 'react-icons/fa6';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	FocusLock,
	HStack,
	Text,
} from '@chakra-ui/react';
import {
	OptionObject,
	PropertiesForm,
	PropertiesFormProps,
} from '@components/PropertiesForm';

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
