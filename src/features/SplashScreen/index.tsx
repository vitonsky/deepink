import React from 'react';
import { Box } from '@chakra-ui/react';

// TODO: implement splash screen
export const SplashScreen = () => {
	return (
		<Box
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
		</Box>
	);
};
