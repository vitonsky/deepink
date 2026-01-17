import React from 'react';
import { Text } from '@chakra-ui/react';

// TODO: implement splash screen
export const SplashScreen = () => {
	return (
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
	);
};
