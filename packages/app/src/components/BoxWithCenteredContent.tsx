import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

export const BoxWithCenteredContent = ({ children, ...props }: BoxProps) => {
	return (
		<Box
			w="100%"
			overflow="auto"
			display="flex"
			flex={1}
			flexFlow="column"
			justifyContent="center"
			alignItems="center"
			{...props}
		>
			{children}
		</Box>
	);
};
