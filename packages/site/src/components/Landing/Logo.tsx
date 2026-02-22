import type React from 'react';
import { Box, HStack } from '@chakra-ui/react';

import LogoIcon from './icon-simple.svg?react';

// TODO: use just an SVG element
export const Logo = () => {
	return (
		<HStack gap=".3rem" fontSize="1.3rem" fontWeight="bold">
			<Box as={LogoIcon} display="inline-block" w="1.2em" h="1.2em" />
			<span>Deepink</span>
		</HStack>
	);
};
