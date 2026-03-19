/* eslint-disable @cspell/spellchecker */
import type * as flexsearch from 'flexsearch';

const { Index } = require('flexsearch');

import { IFilesStorage } from '@core/features/files';
import { ComlinkWorkerFS } from '@core/features/files/ComlinkFS';

import { exposeWorker } from './comlink';
import { IndexWorkerApi } from '.';

// Export worker stub to keep calm the TypeScript
export default null as unknown as new () => Worker;

console.debug('Flex search worker is loaded');

let indexPromise: Promise<{
	index: flexsearch.Index;
	storage: IFilesStorage;
}> | null = null;
const getState = () => {
	if (!indexPromise) throw new Error('Worker is not initialized yet');
	return indexPromise;
};

exposeWorker({
	init: async function (config: flexsearch.IndexOptions, storage) {
		storage = new ComlinkWorkerFS(storage);
		indexPromise = storage.list().then(async (files) => {
			const index = new Index({
				...config,
				priority: 9,
			} satisfies flexsearch.IndexOptions) as flexsearch.Index;

			// Load the data
			await Promise.all(
				files.map(async (file) => {
					const data = await storage.get(file);

					const key = file
						.split('/')
						.find((segment) => segment.trim().length > 0);
					if (key && data) {
						console.debug('Import index data...', {
							key,
							size: data.byteLength,
						});
						await index.import(key, new TextDecoder().decode(data));
					}
				}),
			);

			return { index, storage };
		});

		await indexPromise;
	},

	async commit() {
		const { index, storage } = await getState();
		await index.export((key, data) => {
			return storage.write('/' + key, new TextEncoder().encode(data).buffer);
		});
	},

	async add(id, content) {
		const { index } = await getState();
		await index.add(id, content);
	},
	async update(id, content) {
		const { index } = await getState();
		await index.update(id, content);
	},
	async remove(id) {
		const { index } = await getState();
		await index.remove(id);
	},

	async search(query) {
		const { index } = await getState();
		return index.search(query) as string[];
	},
} satisfies IndexWorkerApi);
