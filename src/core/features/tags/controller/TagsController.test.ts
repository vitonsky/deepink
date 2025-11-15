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

	test('tags with invalid names and duplicates cannot be added', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		// invalid name
		await expect(tags.add('///foo', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.INVALID_FORMAT }),
		);
		await expect(tags.add('/foo/bar', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.INVALID_FORMAT }),
		);
		await expect(tags.add('foo/bar/', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.INVALID_FORMAT }),
		);
		await expect(tags.add('foo//bar', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.INVALID_FORMAT }),
		);

		await expect(tags.getTags()).resolves.toEqual([]);

		// duplicates
		await expect(tags.add('foo', null)).resolves.toEqual(
			expect.stringMatching(/^[0-9a-f-]{8,36}$/i),
		);
		await expect(tags.add('foo', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.DUPLICATE }),
		);

		const tagsList = await tags.getTags();
		const fooId = tagsList[0].id;
		await expect(tags.add('bar', fooId)).resolves.toEqual(
			expect.stringMatching(/^[0-9a-f-]{8,36}$/i),
		);
		await expect(tags.add('bar', fooId)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.DUPLICATE }),
		);

		await expect(tags.add('foo/bar', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.DUPLICATE }),
		);

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
