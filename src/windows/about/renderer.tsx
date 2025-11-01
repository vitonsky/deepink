import React from 'react';
import { createRoot } from 'react-dom/client';
// eslint-disable-next-line spellcheck/spell-checker
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '@components/theme';

import { About } from './About';

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}

document.body.style.overflow = 'hidden';

const reactRoot = createRoot(rootNode);
reactRoot.render(
	<ChakraProvider theme={theme}>
		<About />
	</ChakraProvider>,
);
