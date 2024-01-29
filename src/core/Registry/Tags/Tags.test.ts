import { tmpdir } from 'os';
import { tmpNameSync } from 'tmp';

import { openDatabase } from '../../storage/database/SQLiteDatabase/SQLiteDatabase';

import { Tags } from './Tags';

test('basic usage', async () => {
	const dbPath = tmpNameSync({ dir: tmpdir() });
	const db = await openDatabase({ dbPath });

	const tags = new Tags(db);

	await tags.add('foo', null);
	await tags.add('bar', null).then((tagId) => tags.add('baz', tagId));

	await tags.getTags().then((tags) => {
		expect(tags).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: 'foo',
					parent: null,
					resolvedName: 'foo',
				}),
				expect.objectContaining({
					name: 'bar',
					parent: null,
					resolvedName: 'bar',
				}),
				expect.objectContaining({
					name: 'baz',
					resolvedName: 'bar/baz',
				}),
			]),
		);
	});

	await db.close();
});
