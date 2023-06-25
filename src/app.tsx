import React, { FC } from 'react';
import { createRoot } from 'react-dom/client';

import { notes } from './core/Note';

const App: FC = () => {

	return <div>
		{notes.map((note, id) => {
			return <li key={id}>{note.title ?? note.text.slice(0, 35)}</li>;
		})}
	</div>;
};

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}

const reactRoot = createRoot(rootNode);
reactRoot.render(<App />);