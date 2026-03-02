import type React from 'react';
import { Box, type StackProps, VStack } from '@chakra-ui/react';

import Deepink from './deepink.svg?react';
import Logo from './logo.svg?react';

export const TheRock = (props: StackProps) => {
	return (
		<VStack gap=".5rem" {...props}>
			<Box as={Logo} h="auto" width="100%" />
			<Box as={Deepink} width="100%" h="auto" maxHeight="60px" />
		</VStack>
	);
};
