import { makeAutoClosedDB } from 'src/__tests__/utils/makeAutoClosedDB';
import { getUUID } from 'src/__tests__/utils/uuid';

import { TAG_ERROR_CODE, TagsController } from './TagsController';

const FAKE_WORKSPACE_ID = getUUID();

describe('manage tags', () => {
	const { getDB } = makeAutoClosedDB({ closeHook: afterEach, clearFS: true });

	test('nested tags', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

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
	});

	test('prevent creating weird tags', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		await expect(tags.add('///foo', null)).rejects.toMatchObject({
			code: TAG_ERROR_CODE.INVALID_FORMAT,
		});
		await expect(tags.add('/foo/bar', null)).rejects.toMatchObject({
			code: TAG_ERROR_CODE.INVALID_FORMAT,
		});
		await expect(tags.add('foo/bar/', null)).rejects.toMatchObject({
			code: TAG_ERROR_CODE.INVALID_FORMAT,
		});
		await expect(tags.add('foo//bar', null)).rejects.toMatchObject({
			code: TAG_ERROR_CODE.INVALID_FORMAT,
		});

		await expect(tags.getTags()).resolves.toEqual([]);
	});

	test('prevent duplicate tags', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		// change toBeDefined to check string
		await expect(tags.add('foo', null)).resolves.toEqual(expect.any(String));
		await expect(tags.add('foo', null)).rejects.toMatchObject({
			code: TAG_ERROR_CODE.DUPLICATE,
		});

		await expect(tags.add('foo/bar', null)).resolves.toEqual(expect.any(String));
		await expect(tags.add('foo/bar', null)).rejects.toMatchObject({
			code: TAG_ERROR_CODE.DUPLICATE,
		});

		const bazId = await tags.add('baz', null);
		await expect(tags.add('foo/bar', bazId)).resolves.toEqual(expect.any(String));
		await expect(tags.add('foo/bar', bazId)).rejects.toMatchObject({
			code: TAG_ERROR_CODE.DUPLICATE,
		});

		// duplicate nested tags

		await expect(tags.getTags()).resolves.toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: 'foo',
					parent: null,
					resolvedName: 'foo',
				}),
				expect.objectContaining({
					name: 'bar',
					parent: expect.any(String),
					resolvedName: 'foo/bar',
				}),
				expect.objectContaining({
					id: bazId,
					name: 'baz',
					parent: null,
					resolvedName: 'baz',
				}),
				expect.objectContaining({
					name: 'foo',
					parent: expect.any(String),
					resolvedName: 'baz/foo',
				}),
				expect.objectContaining({
					name: 'bar',
					parent: expect.any(String),
					resolvedName: 'baz/foo/bar',
				}),
			]),
		);
	});

	test('update tags', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

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
	});

	test('delete tags', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

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
	});
});

describe('manage attachments', () => {
	const { getDB } = makeAutoClosedDB({ closeHook: afterEach, clearFS: true });

	const FAKE_NOTE_ID = getUUID();

	test('set attached tags', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		const fooId = await tags.add('foo', null);
		const barId = await tags.add('bar', null);
		const bazId = await tags.add('baz', barId);

		await tags.getAttachedTags(FAKE_NOTE_ID).then((tags) => {
			expect(tags).toEqual([]);
		});

		await tags.setAttachedTags(FAKE_NOTE_ID, [fooId, bazId]);
		await tags.getAttachedTags(FAKE_NOTE_ID).then((tags) => {
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

		await tags.setAttachedTags(FAKE_NOTE_ID, [barId]);
		await tags.getAttachedTags(FAKE_NOTE_ID).then((tags) => {
			expect(tags).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'bar',
						resolvedName: 'bar',
					}),
				]),
			);
		});
	});

	test('deleted tag will not appears in tags list', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		const fooId = await tags.add('foo', null);
		const barId = await tags.add('bar', null);
		const bazId = await tags.add('baz', barId);

		await tags.setAttachedTags(FAKE_NOTE_ID, [fooId, bazId]);

		await tags.delete(bazId);
		await tags.getAttachedTags(FAKE_NOTE_ID).then((tags) => {
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
		await tags.getAttachedTags(FAKE_NOTE_ID).then((tags) => {
			expect(tags).toEqual([]);
		});
	});
});
