import { Endpoint, expose } from 'comlink';
import { Index, IndexOptions } from 'flexsearch';
import { IFilesStorage } from '@core/features/files';
import { ComlinkWorkerFS } from '@core/features/files/ComlinkFS';

import { FlexSearchStorage } from './FlexSearchStorage';
import { IndexWorkerApi } from '.';

console.debug('Flex search worker is loaded');

let indexPromise: Promise<{
	index: Index;
	storage: IFilesStorage;
}> | null = null;
const getState = () => {
	if (!indexPromise) throw new Error('Worker is not initialized yet');
	return indexPromise;
};

expose(
	{
		init: async function (config: IndexOptions, storage) {
			storage = new ComlinkWorkerFS(storage);
			const index = new Index({
				...config,
				priority: 9,
			} satisfies IndexOptions);

			// Load the data
			indexPromise = index
				.mount(new FlexSearchStorage(storage))
				.then(async () => ({ index, storage }));

			await indexPromise;
		},

		async commit() {
			const { index } = await getState();
			await index.commit();
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
	} satisfies IndexWorkerApi,
	self as Endpoint,
);
