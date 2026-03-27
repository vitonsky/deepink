import React from 'react';
import { Box, Text } from '@chakra-ui/react';

// TODO: implement splash screen
export const SplashScreen = () => {
	return (
		<Box
			position="fixed"
			top={0}
			left={0}
			height="100vh"
			width="100%"
			backgroundColor="surface.background"
			zIndex={9999}
		>
			<Text
				sx={{
					display: 'flex',
					height: '100vh',
					width: '100%',
					margin: 'auto',
					justifyContent: 'center',
					alignItems: 'center',
					fontSize: '2rem',
					fontWeight: 'bold',
				}}
			>
				Loading...
			</Text>
		</Box>
	);
};
