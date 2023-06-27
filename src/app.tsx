import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { NotesRegistry } from './core/Registry/NotesRegistry';

// Move registry to main thread and use bindings in renderer thread
export const notesRegistry = new NotesRegistry();

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}


const reactRoot = createRoot(rootNode);
reactRoot.render(<App />);
