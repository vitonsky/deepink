import React, { ReactNode } from 'react';
import { HStack, StackProps, Text, TextProps } from '@chakra-ui/react';

export const TextWithIcon = ({
	icon,
	textProps,
	children,
	...props
}: StackProps & { icon?: ReactNode; textProps?: TextProps }) => {
	return (
		<HStack {...props}>
			{icon}
			<Text as="span" {...textProps}>
				{children}
			</Text>
		</HStack>
	);
};
