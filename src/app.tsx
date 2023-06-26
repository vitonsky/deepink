import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { INote, notesRegistry } from './core/Note';

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}

(async () => {
	const notes: INote[] = [
		{
			text: `Nulla quia sunt vel ea est ea. Qui reprehenderit quibusdam et quia. Natus minima culpa dolor. Velit aliquid cum aut enim molestias voluptatem consequatur culpa. Voluptatem impedit tenetur quisquam et hic.
	 
		Aliquam corporis laborum molestiae. Autem necessitatibus corporis ex sunt eveniet quo et. Id provident animi. Sit modi saepe error doloribus est voluptas rerum nemo.
		 
		Nihil eum ducimus consequatur reiciendis rem accusamus aut. At nobis adipisci qui quidem voluptatem. Ut velit consequuntur iusto nihil sint nisi saepe cumque sint. Voluptatem ex dicta sapiente eum sit.`
		},
		{
			title: 'Sint voluptas sunt',
			text: `Sint voluptas sunt et soluta perferendis qui animi. Et nam saepe incidunt dignissimos reprehenderit. In corrupti dolorum excepturi alias rerum est qui est sunt. Atque ipsa aperiam consequatur odit dolorum sit.
	 
	Quos aut consequuntur quae rem accusantium ut cum ipsam aperiam. Rerum totam hic corrupti eaque. Quaerat iusto aliquam rerum modi maiores aut suscipit ratione eveniet. Dolorum est quos voluptatem. Ex minus dolorem omnis optio aperiam porro est. Vel voluptate dolorum quibusdam excepturi quae aut illum.
	 
	Fugiat quia hic tempora fugit illum repellat sint. Culpa et rem quos quisquam quaerat ipsum ea. Vitae delectus assumenda iusto aut qui omnis. Id dolorum placeat modi. Exercitationem omnis odit quia.`
		}
	].concat(Array(15).fill({ text: 'Test markdown content' }));
	Promise.all(notes.map((note) => notesRegistry.addNote(note)));

	const reactRoot = createRoot(rootNode);
	reactRoot.render(<App />);
})();