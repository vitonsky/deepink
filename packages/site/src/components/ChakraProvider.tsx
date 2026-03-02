import React, { type ReactNode } from 'react';
import { ChakraProvider as BaseChakraProvider } from '@chakra-ui/react';

import { system } from '../theme';

interface ChakraProviderProps {
	children: ReactNode;
}

export default function ChakraProvider({ children }: ChakraProviderProps) {
	return <BaseChakraProvider value={system}>{children}</BaseChakraProvider>;
}
