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

	test('tags with invalid names cannot be added', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		await expect(tags.add('', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.INVALID_FORMAT }),
		);
		await expect(tags.add('   ', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.INVALID_FORMAT }),
		);
		await expect(tags.add(' /  / ', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.INVALID_FORMAT }),
		);
		await expect(tags.add(' / //  ', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.INVALID_FORMAT }),
		);
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
	});

	test('cannot create a tag with a non-existing parent', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		const nonExistentTag = getUUID();
		await expect(tags.add('foo', nonExistentTag)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.PARENT_TAG_NOT_EXIST }),
		);
		await expect(tags.add('foo/bar', nonExistentTag)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.PARENT_TAG_NOT_EXIST }),
		);
		await expect(tags.add('foo/bar/baz', nonExistentTag)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.PARENT_TAG_NOT_EXIST }),
		);
	});

	test('adds only the missing segments of the tag name without recreating existing ones', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		const fooId = await tags.add('foo', null);

		await expect(tags.add('foo', fooId)).resolves.toBeTypeOf('string');
		await tags.getTags().then((tags) => {
			expect(tags).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'foo',
						parent: null,
						resolvedName: 'foo',
					}),
					expect.objectContaining({
						name: 'foo',
						parent: expect.any(String),
						resolvedName: 'foo/foo',
					}),
				]),
			);

			expect(tags).toHaveLength(2);
		});

		const barId = await tags.add('foo/bar', null);
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
						parent: expect.any(String),
						resolvedName: 'foo/bar',
					}),
				]),
			);

			expect(tags).toHaveLength(3);
		});

		await expect(tags.add('bar/baz', fooId)).resolves.toBeTypeOf('string');
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
						parent: expect.any(String),
						resolvedName: 'foo/bar',
					}),
					expect.objectContaining({
						name: 'baz',
						parent: expect.any(String),
						resolvedName: 'foo/bar/baz',
					}),
				]),
			);

			expect(tags).toHaveLength(4);
		});

		await expect(tags.add('bar/bar', barId)).resolves.toBeTypeOf('string');
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
						parent: expect.any(String),
						resolvedName: 'foo/bar',
					}),
					expect.objectContaining({
						name: 'bar',
						parent: expect.any(String),
						resolvedName: 'foo/bar/bar',
					}),
					expect.objectContaining({
						name: 'bar',
						parent: expect.any(String),
						resolvedName: 'foo/bar/bar/bar',
					}),
				]),
			);

			expect(tags).toHaveLength(6);
		});

		await expect(tags.add('foo/bar/foo/bar', null)).resolves.toBeTypeOf('string');
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
						parent: expect.any(String),
						resolvedName: 'foo/bar',
					}),
					expect.objectContaining({
						name: 'foo',
						parent: expect.any(String),
						resolvedName: 'foo/bar/foo',
					}),
					expect.objectContaining({
						name: 'bar',
						parent: expect.any(String),
						resolvedName: 'foo/bar/foo/bar',
					}),
				]),
			);

			expect(tags).toHaveLength(8);
		});

		await expect(tags.add('tag1/tag2/tag3', null)).resolves.toBeTypeOf('string');
		await tags.getTags().then((tags) => {
			expect(tags).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'tag1',
						parent: null,
						resolvedName: 'tag1',
					}),
					expect.objectContaining({
						name: 'tag2',
						parent: expect.any(String),
						resolvedName: 'tag1/tag2',
					}),
					expect.objectContaining({
						name: 'tag3',
						parent: expect.any(String),
						resolvedName: 'tag1/tag2/tag3',
					}),
				]),
			);

			expect(tags).toHaveLength(11);
		});
	});

	test('duplicate tag cannot be added', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		const fooId = await tags.add('foo', null);

		await expect(tags.add('foo', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.DUPLICATE }),
		);

		await expect(tags.add('bar', fooId)).resolves.toBeTypeOf('string');
		await expect(tags.add('bar', fooId)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.DUPLICATE }),
		);
		await expect(tags.add('foo/bar', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.DUPLICATE }),
		);

		await expect(tags.add('bar/baz', fooId)).resolves.toBeTypeOf('string');
		await expect(tags.add('bar/baz', fooId)).rejects.toThrow(
			expect.objectContaining({
				code: TAG_ERROR_CODE.DUPLICATE,
			}),
		);

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
						parent: expect.any(String),
						resolvedName: 'foo/bar',
					}),
					expect.objectContaining({
						name: 'baz',
						parent: expect.any(String),
						resolvedName: 'foo/bar/baz',
					}),
				]),
			);

			expect(tags).toHaveLength(3);
		});
	});

	test('cannot update tag with an invalid name', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		await tags.add('foo', null).then(async (tagId) => {
			await expect(
				tags.update({
					id: tagId,
					name: 'renamedFoo/',
					parent: null,
				}),
			).rejects.toThrow(
				expect.objectContaining({ code: TAG_ERROR_CODE.INVALID_FORMAT }),
			);

			await expect(
				tags.update({
					id: tagId,
					name: '',
					parent: null,
				}),
			).rejects.toThrow(
				expect.objectContaining({ code: TAG_ERROR_CODE.INVALID_FORMAT }),
			);
		});
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
