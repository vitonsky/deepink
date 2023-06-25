import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}

const reactRoot = createRoot(rootNode);
reactRoot.render(<App />);