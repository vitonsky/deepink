import { InMemoryFS } from '@core/features/files/InMemoryFS';

import { NotesTextIndex } from './NotesTextIndex';

describe('Persistence', () => {
	const indexFs = new InMemoryFS();

	test('Fill the index', async () => {
		const index = new NotesTextIndex(indexFs);
		const session = await index.createIndexSession();

		await Promise.all([
			session.add('foo', 'The foo content'),
			session.add('bar', 'The bar content'),
		]);

		await session.commit();
	});

	test('Search in index in another session', async () => {
		const index = new NotesTextIndex(indexFs);
		await expect(index.query('FOO CONTENT')).resolves.toEqual(['foo']);
	});

	test('Index are empty after drop the FS', async () => {
		await indexFs.delete(await indexFs.list());
		await expect(indexFs.list()).resolves.toEqual([]);

		const index = new NotesTextIndex(indexFs);
		await expect(index.query('FOO CONTENT')).resolves.toEqual([]);
	});
});
