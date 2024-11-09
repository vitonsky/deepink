import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
// eslint-disable-next-line spellcheck/spell-checker
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '@components/theme';
import { App } from '@features/App/index';
import { store } from '@state/redux/store';

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}

document.body.style.overflow = 'hidden';

const reactRoot = createRoot(rootNode);
reactRoot.render(
	<Provider store={store}>
		<ChakraProvider theme={theme}>
			<App />
		</ChakraProvider>
	</Provider>,
);
