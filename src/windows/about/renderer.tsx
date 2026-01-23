import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
// eslint-disable-next-line spellcheck/spell-checker
import { ThemeProvider } from '@features/ThemeProvider';
import { loadStore } from '@state/redux/persistence';
import { store } from '@state/redux/store';

// eslint-disable-next-line spellcheck/spell-checker
import { About } from './About';

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}

document.body.style.overflow = 'hidden';

loadStore(store);

const reactRoot = createRoot(rootNode);
reactRoot.render(
	<Provider store={store}>
		<ThemeProvider>
			<About />
		</ThemeProvider>
	</Provider>,
);
