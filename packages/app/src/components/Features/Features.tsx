import React, { FC } from 'react';
import { StackProps, VStack } from '@chakra-ui/react';

export type FeaturesProps = StackProps;

export const Features: FC<FeaturesProps> = ({ children, ...rest }) => {
	return (
		<VStack gap="1.5rem" align="start" {...rest}>
			{children}
		</VStack>
	);
};
