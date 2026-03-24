import { Index } from 'flexsearch';
import { InMemoryFS } from '@core/features/files/InMemoryFS';

import { FlexSearchStorage } from './FlexSearchStorage';

test('Reuse storage', async () => {
	const storage = new InMemoryFS();

	// Add the data on one instance
	const index1 = new Index();
	await index1.mount(new FlexSearchStorage(storage));

	await expect(index1.search('foo')).resolves.toEqual([]);

	await index1.add('foo', 'The foo content');
	await index1.add('bar', 'The bar content');
	await index1.commit();
	await expect(index1.search('foo')).resolves.toEqual(['foo']);

	// Access the storage data in another instance
	const index2 = new Index();
	await index2.mount(new FlexSearchStorage(storage));

	await expect(index2.search('foo')).resolves.toEqual(['foo']);
});
