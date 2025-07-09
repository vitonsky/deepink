/* eslint-disable spellcheck/spell-checker */
import { getUUID } from 'src/__tests__/utils/uuid';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { LexemesRegistry } from './LexemesRegistry';
import { NotesController } from './NotesController';

const FAKE_WORKSPACE_ID = getUUID();

describe('CRUD operations', () => {
	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	test('insertion multiple entries', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		const entries = [
			{ title: 'Title 1', text: 'Text 1' },
			{ title: 'Title 2', text: 'Text 2' },
			{ title: 'Title 3', text: 'Text 3' },
		];

		const ids = await Promise.all(entries.map((note) => registry.add(note)));
		expect(ids).toHaveLength(entries.length);

		// Entries match data
		await registry.get().then((dbEntries) => {
			dbEntries.forEach((dbEntry) => {
				const entryIndex = ids.indexOf(dbEntry.id);
				const originalEntry = entries[entryIndex];

				expect(dbEntry.content).toMatchObject(originalEntry);
			});
		});
	});

	test('update entry and get by id', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		// Entries match data
		const entries = await registry.get();

		const entryV1 = entries[1];

		const modifiedData = { title: 'Modified title', text: 'Modified text' };
		await registry.update(entryV1.id, modifiedData);

		const entryV2 = await registry.getById(entryV1.id);
		expect(entryV2?.content).toMatchObject(modifiedData);
		expect(entryV2?.createdTimestamp).toBe(entryV1.createdTimestamp);
		expect(entryV2?.updatedTimestamp).not.toBe(entryV1.updatedTimestamp);
	});

	test('delete entries', async () => {
		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		// Insert entries to test
		const notesSample = Array(300)
			.fill(null)
			.map((_, idx) => {
				return {
					title: 'Note title #' + idx,
					text: 'Note text #' + idx,
				};
			});

		await Promise.all(notesSample.map((note) => registry.add(note)));

		// Delete notes
		await registry.get({ limit: 100 }).then(async (notes) => {
			const lengthBeforeDelete = await registry.getLength();
			await registry.delete(notes.map((note) => note.id));
			await registry.getLength().then((length) => {
				expect(length).toBe(lengthBeforeDelete - 100);
			});
		});

		await registry.get({ limit: 1 }).then(async (notes) => {
			const lengthBeforeDelete = await registry.getLength();
			await registry.delete([notes[0].id]);
			await registry.getLength().then((length) => {
				expect(length).toBe(lengthBeforeDelete - 1);
			});
		});

		await db.close();
	});

	test('to mark notes as deleted', async () => {
		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, 'fake-workspace-id');

		// Insert entries to test
		const notesSample = Array(300)
			.fill(null)
			.map((_, idx) => {
				return {
					title: 'Note title #' + idx,
					text: 'Note text #' + idx,
				};
			});
		await Promise.all(notesSample.map((note) => registry.add(note)));

		// deleted a set of notes to the bin; the quantity should not change
		await registry.get({ limit: 100 }).then(async (notes) => {
			const lengthBeforeDelete = await registry.getLength();
			await registry.delete(
				notes.map((note) => note.id),
				{ permanent: false },
			);

			await registry.getLength().then((length) => {
				expect(length).toBe(lengthBeforeDelete);
			});
		});

		//  deleted one note
		await registry.get({ limit: 1 }).then(async (notes) => {
			const lengthBeforeDelete = await registry.getLength();
			await registry.delete([notes[0].id], { permanent: false });

			await registry.getLength().then((length) => {
				expect(length).toBe(lengthBeforeDelete);
			});
		});

		await db.close();
	});
});

describe('data fetching', () => {
	const dbFile = createFileControllerMock();

	const notesSample = Array(300)
		.fill(null)
		.map((_, idx) => {
			return {
				title: 'Note title #' + idx,
				text: 'Note text #' + idx,
			};
		});

	test('insert sample entries', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		const ids: string[] = [];
		for (const note of notesSample) {
			ids.push(await registry.add(note));
		}

		const tags = new TagsController(db, FAKE_WORKSPACE_ID);
		await tags.setAttachedTags(ids[0], [await tags.add('foo', null)]);
		await tags.setAttachedTags(ids[1], [await tags.add('bar', null)]);

		await db.close();
	});

	test('filter by tags', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		const tagsList = await tags.getTags();

		await expect(
			registry.get({
				tags: [tagsList.find((tag) => tag.resolvedName === 'foo')?.id as string],
			}),
		).resolves.toHaveLength(1);

		await expect(
			registry.get({
				tags: [tagsList.find((tag) => tag.resolvedName === 'bar')?.id as string],
			}),
		).resolves.toHaveLength(1);

		await db.close();
	});

	test('get entries by pages', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		await registry.getLength().then((length) => {
			expect(length).toBe(notesSample.length);
		});

		// Invalid page must throw errors
		await expect(registry.get({ limit: 100, page: 0 })).rejects.toThrow();
		await expect(registry.get({ limit: 100, page: -100 })).rejects.toThrow();

		const page1 = await registry.get({ limit: 100, page: 1 });
		expect(page1[0].content).toMatchObject(notesSample[0]);

		const page2 = await registry.get({ limit: 100, page: 2 });
		expect(page2[0].content).toMatchObject(notesSample[100]);

		await db.close();
	});

	test('method getLength consider filters', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		const notesId = await registry
			.get({ limit: 10 })
			.then((notes) => notes.map((note) => note.id));
		await registry.updateMeta(notesId, { isVisible: false });

		await expect(registry.getLength({ meta: { isVisible: false } })).resolves.toBe(
			10,
		);
		await expect(registry.getLength({ meta: { isVisible: true } })).resolves.toBe(
			notesSample.length - 10,
		);

		await db.close();
	});

	test('get entries by deletion status', async () => {
		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, 'fake-workspace-id');

		const entries = [
			{ title: 'Title 1', text: 'Text 1' },
			{ title: 'Title 2', text: 'Text 2' },
			{ title: 'Title 3', text: 'Text 3' },
		];

		const ids = await Promise.all(entries.map((note) => registry.add(note)));
		expect(ids).toHaveLength(entries.length);

		const lengthBeforeDelete = await registry.getLength();

		// mark notes as deleted
		await registry.delete([ids[0]], { permanent: false });

		// get all notes
		await registry.get().then(async (dbEntries) => {
			expect(dbEntries).toHaveLength(lengthBeforeDelete);
		});

		// get only deleted notes
		await registry.get({ includeDeleted: true }).then((dbEntries) => {
			expect(dbEntries).toHaveLength(lengthBeforeDelete - 2);
			dbEntries.forEach((dbEntry) => {
				expect(dbEntry.isDeleted).toBe(true);
			});
		});

		// get only non-deleted notes
		await registry.get({ includeDeleted: false }).then((dbEntries) => {
			expect(dbEntries).toHaveLength(lengthBeforeDelete - 1);
			dbEntries.forEach((dbEntry) => {
				expect(dbEntry.isDeleted).toBe(false);
			});
		});

		await db.close();
	});
});

describe('multi instances', () => {
	const dbFile = createFileControllerMock();

	test('insertion multiple entries and close with sync data', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		const notes = [
			{ title: 'Title 1', text: 'Text 1' },
			{ title: 'Title 2', text: 'Text 2' },
			{ title: 'Title 3', text: 'Text 3' },
		];

		await Promise.all(notes.map((note) => registry.add(note)));
		await db.close();
	});

	test('read entries from previous step', async () => {
		const db = await openDatabase(dbFile);
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		// Entries match data
		const entries = await registry.get();

		expect(entries).toHaveLength(3);
		expect(entries[1].content.title.length).toBeGreaterThan(0);
		expect(entries[1].content.text.length).toBeGreaterThan(0);
		await db.close();
	});
});

describe('Notes meta control', () => {
	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	test('toggle note versions control', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		// Create note
		const noteId = await registry.add({ title: 'Title', text: 'Text' });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isSnapshotsDisabled: false,
		});

		// Toggle snapshotting preferences
		await registry.updateMeta([noteId], { isSnapshotsDisabled: true });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isSnapshotsDisabled: true,
		});

		// Toggle snapshotting preferences back
		await registry.updateMeta([noteId], { isSnapshotsDisabled: false });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isSnapshotsDisabled: false,
		});
	});

	test('toggle note visibility', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		// Create note
		const noteId = await registry.add({ title: 'Title', text: 'Text' });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isVisible: true,
		});
		await expect(registry.get()).resolves.toContainEqual(
			expect.objectContaining({
				id: noteId,
			}),
		);

		// Toggle snapshotting preferences
		await registry.updateMeta([noteId], { isVisible: false });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isVisible: false,
		});
		await expect(registry.get()).resolves.not.toContainEqual(
			expect.objectContaining({
				id: noteId,
			}),
		);

		// Toggle snapshotting preferences back
		await registry.updateMeta([noteId], { isVisible: true });
		await expect(registry.getById(noteId)).resolves.toMatchObject({
			id: noteId,
			isVisible: true,
		});
		await expect(registry.get()).resolves.toContainEqual(
			expect.objectContaining({
				id: noteId,
			}),
		);
	});
});

describe('Notes search', () => {
	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	const texts = [
		'A fast auburn fox leaped above a sleepy canine',
		'PostgreSQL trigram indexing speeds up fuzzy text search',
		'Full-text search and trigram search solve different problems',
		'The database index makes LIKE queries fast',
		'Fuzzy string matching can catch small typos in text',
		'A lazy dog was sleeping near the river bank',
		'The quick red fox jumped high above the hedge',
		'Speedy foxes and sleepy dogs appear in many idioms',
		'The quick brown fox jumps over the lazy dog',
		'Trigram search helps find similar product names quickly',
	];

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	let tagsMap: Record<string, string>;
	test('Add notes', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);
		const tags = new TagsController(db, FAKE_WORKSPACE_ID);

		tagsMap = await Promise.all(
			['1th', '2th', '3th', 'none'].map(async (name) => [
				name,
				await tags.add(name, null),
			]),
		).then((tags) => Object.fromEntries(tags));

		await Promise.all(
			texts.map(async (text, index) => {
				const noteId = await registry.add({ title: `Note #${index + 1}`, text });

				const seqNum = index + 1;
				await tags.setAttachedTags(
					noteId,
					[
						tagsMap['1th'],
						seqNum % 2 === 0 && tagsMap['2th'],
						seqNum % 3 === 0 && tagsMap['3th'],
					].filter(Boolean) as string[],
				);

				return noteId;
			}),
		);
	});

	test('Update lexemes', async () => {
		const db = await dbPromise;
		const lexemes = new LexemesRegistry(db);
		await expect(lexemes.index()).resolves.not.toHaveLength(0);
	});

	test('Search by text', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		await expect(
			registry.get({ search: { text: 'fox' }, limit: 3 }),
			'Top results includes a word for search',
		).resolves.toEqual(
			Array.from({ length: 3 }).map(() =>
				expect.objectContaining({
					content: expect.objectContaining({
						text: expect.stringContaining('fox'),
					}),
				}),
			),
		);

		await expect(
			registry.get({ search: { text: 'FOX' }, limit: 3 }),
			'Search ignores text case',
		).resolves.toEqual(
			Array.from({ length: 3 }).map(() =>
				expect.objectContaining({
					content: expect.objectContaining({
						text: expect.stringContaining('fox'),
					}),
				}),
			),
		);

		await expect(
			registry.get({ search: { text: 'qick' }, limit: 3 }),
			'Search is typo tolerant',
		).resolves.toEqual(
			Array.from({ length: 2 }).map(() =>
				expect.objectContaining({
					content: expect.objectContaining({
						text: expect.stringContaining('quick'),
					}),
				}),
			),
		);

		await expect(
			registry.get({ search: { text: '#4' }, limit: 1 }),
			'Search works for note titles',
		).resolves.toEqual([
			expect.objectContaining({
				content: expect.objectContaining({
					title: 'Note #4',
				}),
			}),
		]);
	});

	test('Search by text and filter by tags', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		await expect(
			registry.get({ search: { text: 'Note' } }),
			'Fetch notes for control',
		).resolves.toHaveLength(texts.length);

		await expect(
			registry.get({ search: { text: 'Note' }, meta: { isVisible: false } }),
			'Filter by meta properties hides results',
		).resolves.toHaveLength(0);

		await expect(
			registry.get({ search: { text: 'Note' }, tags: [tagsMap['none']] }),
			'Filter by not attached tag returns no results',
		).resolves.toHaveLength(0);

		await expect(
			registry.get({ search: { text: 'Note' }, tags: [tagsMap['1th']] }),
			'Filter by specific tag',
		).resolves.toHaveLength(texts.length);

		await expect(
			registry.get({ search: { text: 'Note' }, tags: [tagsMap['2th']] }),
			'Filter by specific tag',
		).resolves.toHaveLength(Math.floor(texts.length / 2));

		await expect(
			registry.get({ search: { text: 'Note' }, tags: [tagsMap['3th']] }),
			'Filter by specific tag',
		).resolves.toHaveLength(Math.floor(texts.length / 3));

		await expect(
			registry.get({
				search: { text: 'Note #2' },
				tags: [tagsMap['3th']],
				limit: 1,
			}),
			'Search returns most similar text after filtering',
		).resolves.not.toEqual([
			expect.objectContaining({
				content: expect.objectContaining({
					title: 'Note #2',
				}),
			}),
		]);

		await expect(
			registry.get({
				search: { text: 'Note #2' },
				tags: [tagsMap['2th']],
				limit: 1,
			}),
			'Exact match with filter must be at top of the list',
		).resolves.toEqual([
			expect.objectContaining({
				content: expect.objectContaining({
					title: 'Note #2',
				}),
			}),
		]);
	});

	test('Lexemes list can be updated after changes', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);
		const lexemes = new LexemesRegistry(db);

		const [note] = await registry.get({ search: { text: 'leaped' }, limit: 1 });

		expect(note).not.toBeUndefined();
		expect(note.content.text, 'Found expected note').toBe(
			'A fast auburn fox leaped above a sleepy canine',
		);

		await expect(
			lexemes.getList(),
			'Lexemes list have words of note text',
		).resolves.toContain('leaped');
		await expect(
			lexemes.getList(),
			'Lexemes list have no a target word for test',
		).resolves.not.toContain('unique');

		await registry.update(note.id, {
			title: 'Updated note',
			text: 'Updated text with unique text',
		});
		await expect(lexemes.index()).resolves.not.toHaveLength(0);
		await expect(lexemes.prune()).resolves.not.toHaveLength(0);

		await expect(
			lexemes.getList(),
			'Unused lexeme must be deleted',
		).resolves.not.toContain('leaped');
		await expect(lexemes.getList(), 'New lexemes must be added').resolves.toContain(
			'unique',
		);

		await expect(
			registry.get({ search: { text: 'unique text' }, limit: 1 }),
			'Note can be found by updated text',
		).resolves.toEqual([expect.objectContaining({ id: note.id })]);
	});
});
