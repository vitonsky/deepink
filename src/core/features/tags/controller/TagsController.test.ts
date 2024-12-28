import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from '../../../storage/database/SQLiteDatabase/SQLiteDatabase';

import { TagsController } from './TagsController';

describe('manage tags', () => {
	test('nested tags', async () => {
		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);

		const tags = new TagsController(db, 'workspace-fake-id');

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

	test('update tags', async () => {
		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);

		const tags = new TagsController(db, 'workspace-fake-id');

		await tags.add('foo', null).then(async (tagId) => {
			await tags.update({
				id: tagId,
				name: 'renamedFoo',
				parent: null,
			});
		});

		await tags.add('bar', null).then(async (tagId) => {
			await tags.add('baz', tagId);

			await tags.update({
				id: tagId,
				name: 'renamedBar',
				parent: null,
			});
		});

		await tags.getTags().then((tags) => {
			expect(tags).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'renamedFoo',
						parent: null,
						resolvedName: 'renamedFoo',
					}),
					expect.objectContaining({
						name: 'renamedBar',
						parent: null,
						resolvedName: 'renamedBar',
					}),
					expect.objectContaining({
						name: 'baz',
						resolvedName: 'renamedBar/baz',
					}),
				]),
			);
		});

		await db.close();
	});

	test('delete tags', async () => {
		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);

		const tags = new TagsController(db, 'workspace-fake-id');

		await tags.add('foo', null);

		const barId = await tags.add('bar', null);
		await tags.add('baz', barId);

		await tags.delete(barId);

		await tags.getTags().then((tags) => {
			expect(tags).toEqual([
				expect.objectContaining({
					name: 'foo',
					resolvedName: 'foo',
				}),
			]);
		});

		await db.close();
	});
});

describe('manage attachments', () => {
	test('set attached tags', async () => {
		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);

		const tags = new TagsController(db, 'workspace-fake-id');

		const fooId = await tags.add('foo', null);
		const barId = await tags.add('bar', null);
		const bazId = await tags.add('baz', barId);

		await tags.getAttachedTags('target1').then((tags) => {
			expect(tags).toEqual([]);
		});

		await tags.setAttachedTags('target1', [fooId, bazId]);
		await tags.getAttachedTags('target1').then((tags) => {
			expect(tags).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'foo',
						resolvedName: 'foo',
					}),
					expect.objectContaining({
						name: 'baz',
						resolvedName: 'bar/baz',
					}),
				]),
			);
		});

		await tags.setAttachedTags('target1', [barId]);
		await tags.getAttachedTags('target1').then((tags) => {
			expect(tags).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'bar',
						resolvedName: 'bar',
					}),
				]),
			);
		});

		await db.close();
	});

	test('deleted tag will not appears in tags list', async () => {
		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);

		const tags = new TagsController(db, 'workspace-fake-id');

		const fooId = await tags.add('foo', null);
		const barId = await tags.add('bar', null);
		const bazId = await tags.add('baz', barId);

		await tags.setAttachedTags('target1', [fooId, bazId]);

		await tags.delete(bazId);
		await tags.getAttachedTags('target1').then((tags) => {
			expect(tags).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'foo',
						resolvedName: 'foo',
					}),
				]),
			);
		});

		await tags.delete(fooId);
		await tags.getAttachedTags('target1').then((tags) => {
			expect(tags).toEqual([]);
		});

		await db.close();
	});
});
