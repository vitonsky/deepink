import { Index } from 'flexsearch';
import { InMemoryFS } from '@core/features/files/InMemoryFS';

import { FlexSearchStorage } from './FlexSearchStorage';

const indexFs = new InMemoryFS();

test('Fill the index', async () => {
	const index = new Index();
	await index.mount(new FlexSearchStorage(indexFs));

	await expect(index.search('foo')).resolves.toEqual([]);

	await index.add('foo', 'The foo content');
	await index.add('bar', 'The bar content');
	await index.commit();
	await expect(index.search('foo')).resolves.toEqual(['foo']);
});

test('Reuse the index', async () => {
	const index = new Index();
	await index.mount(new FlexSearchStorage(indexFs));

	await expect(index.search('foo')).resolves.toEqual(['foo']);
});
