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

		// this parent tag not exist
		const nonExistentTag = getUUID();
		await expect(tags.add('foo/bar/foo', nonExistentTag)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.TAG_NOT_EXIST }),
		);
	});

	test('does not duplicate existing tags and reuse them', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		await expect(tags.add('foo', null)).resolves.toBeTypeOf('string');
		await expect(tags.add('foo/bar', null)).resolves.toBeTypeOf('string');
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

		const tagsList1 = await tags.getTags();
		const fooTag = tagsList1.find((t) => t.name === 'foo' && t.parent === null)!;
		expect(fooTag).not.toBeUndefined();
		await expect(tags.add('bar/baz', fooTag.id)).resolves.toBeTypeOf('string');
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
					name: 'baz',
					parent: expect.any(String),
					resolvedName: 'foo/bar/baz',
				}),
			]),
		);

		const tagsList2 = await tags.getTags();
		const barTag = tagsList2.find((t) => t.name === 'bar')!;
		expect(barTag).not.toBeUndefined();

		// foo/bar/bar/bar
		await expect(tags.add('bar/bar', barTag.id)).resolves.toBeTypeOf('string');
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

		await expect(tags.add('foo/bar/foo/bar', null)).resolves.toBeTypeOf('string');
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
	});

	test('duplicate tag cannot be added', async () => {
		const db = await getDB();
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		await expect(tags.add('foo', null)).resolves.toBeTypeOf('string');
		await expect(tags.add('foo', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.DUPLICATE }),
		);

		const tagsList1 = await tags.getTags();
		const fooTag = tagsList1.find((t) => t.name === 'foo')!;
		expect(fooTag).not.toBeUndefined();

		// "foo/foo"
		await expect(tags.add('foo', fooTag.id)).resolves.toBeTypeOf('string');

		// "foo/bar"
		await expect(tags.add('bar', fooTag.id)).resolves.toBeTypeOf('string');
		await expect(tags.add('bar', fooTag.id)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.DUPLICATE }),
		);
		await expect(tags.add('foo/bar', null)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.DUPLICATE }),
		);

		await expect(tags.add('x/y/z', null)).resolves.toBeTypeOf('string');
		await expect(tags.add('x/y/z', null)).rejects.toThrow(
			expect.objectContaining({
				code: TAG_ERROR_CODE.DUPLICATE,
			}),
		);

		const tagsList2 = await tags.getTags();

		// create y/z from x parent
		const tagX = tagsList2.find((t) => t.name === 'x')!;
		expect(tagX).not.toBeUndefined();
		await expect(tags.add('y/z', tagX.id)).rejects.toThrow(
			expect.objectContaining({ code: TAG_ERROR_CODE.DUPLICATE }),
		);

		// create z from y parent
		const tagY = tagsList2.find((t) => t.name === 'y')!;
		expect(tagY).not.toBeUndefined();
		await expect(tags.add('z', tagY.id)).rejects.toThrow(
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
					name: 'foo',
					parent: expect.any(String),
					resolvedName: 'foo/foo',
				}),
				expect.objectContaining({
					name: 'bar',
					parent: expect.any(String),
					resolvedName: 'foo/bar',
				}),
				expect.objectContaining({
					name: 'x',
					parent: null,
					resolvedName: 'x',
				}),
				expect.objectContaining({
					name: 'y',
					parent: expect.any(String),
					resolvedName: 'x/y',
				}),
				expect.objectContaining({
					name: 'z',
					parent: expect.any(String),
					resolvedName: 'x/y/z',
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
