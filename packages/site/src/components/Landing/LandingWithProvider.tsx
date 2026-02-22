import React from 'react';

import ChakraProvider from '../ChakraProvider';
import Landing from '.';

export default function LandingWithProvider() {
	return (
		<ChakraProvider>
			<Landing />
		</ChakraProvider>
	);
}
