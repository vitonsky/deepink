import React, { ReactNode } from 'react';
import { HStack, StackProps, Text } from '@chakra-ui/react';

export const TextWithIcon = ({
	icon,
	children,
	...props
}: StackProps & { icon?: ReactNode }) => {
	return (
		<HStack {...props}>
			{icon}
			<Text>{children}</Text>
		</HStack>
	);
};
