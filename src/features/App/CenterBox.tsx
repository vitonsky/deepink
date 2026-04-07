import React, { FC, PropsWithChildren } from 'react';
import { Box, Center } from '@chakra-ui/react';

export const CenterBox: FC<PropsWithChildren> = ({ children }) => {
	return (
		<Center h="100vh">
			<Box maxW="500px" minW="350px">
				{children};
			</Box>
		</Center>
	);
};
