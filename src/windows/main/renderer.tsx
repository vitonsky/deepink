import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from '@features/App/index';
import { store } from '@state/redux/store';

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}

const reactRoot = createRoot(rootNode);
reactRoot.render(
	<Provider store={store}>
		<App />
	</Provider>,
);
