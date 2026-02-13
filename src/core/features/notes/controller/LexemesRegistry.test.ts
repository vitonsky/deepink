import { getUUID } from 'src/__tests__/utils/uuid';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { LexemesRegistry } from './LexemesRegistry';
import { NotesController } from './NotesController';

const FAKE_WORKSPACE_ID = getUUID();

const dbFile = createFileControllerMock();
const dbPromise = openDatabase(dbFile);

afterAll(async () => {
	const db = await dbPromise;
	await db.close();
});

test('insert few notes', async () => {
	const db = await dbPromise;
	const registry = new NotesController(db, FAKE_WORKSPACE_ID);

	await Promise.all(
		Array(3)
			.fill(null)
			.map((_, index) =>
				registry.add({ title: `Title ${index + 1}`, text: `Text ${index + 1}` }),
			),
	);
});

test('index method adds lexemes into list', async () => {
	const db = await dbPromise;
	const lexemes = new LexemesRegistry(db);

	await expect(lexemes.getList(), 'lexemes registry is empty').resolves.toHaveLength(0);

	await expect(
		lexemes.index(),
		'First call for indexing must add few lexemes',
	).resolves.toEqual(['title', 'text', '3', '2', '1']);
	await expect(
		lexemes.index(),
		'Second call for indexing adds nothing',
	).resolves.toEqual([]);

	await expect(
		lexemes.getList(),
		'lexemes registry is not empty',
	).resolves.not.toHaveLength(0);
});

test('index method adds lexemes after changes in notes', async () => {
	const db = await dbPromise;
	const lexemes = new LexemesRegistry(db);

	const notes = new NotesController(db, FAKE_WORKSPACE_ID);
	const noteId = await notes.add({ title: 'New note', text: 'New note content' });

	await expect(lexemes.getList()).resolves.not.toContain('new');

	await expect(lexemes.index()).resolves.toEqual(
		expect.arrayContaining(['new', 'note', 'content']),
	);
	await expect(lexemes.getList()).resolves.toContain('new');

	await notes.update(noteId, {
		title: 'New note',
		text: 'New note with updated content',
	});
	await expect(lexemes.index()).resolves.toEqual(
		expect.arrayContaining(['with', 'updated']),
	);
	await expect(lexemes.getList()).resolves.toEqual(
		expect.arrayContaining(['new', 'note', 'with', 'updated', 'content']),
	);
});

test('suggests must include similar words, but not the same words', async () => {
	const db = await dbPromise;
	const lexemes = new LexemesRegistry(db);

	await expect(lexemes.getSuggests(['tile', 'tex', 'unknown'])).resolves.toEqual([
		{
			word: 'tile',
			suggests: ['title'],
		},
		{
			word: 'tex',
			suggests: ['text'],
		},
		{
			word: 'unknown',
			suggests: [],
		},
	]);
});

describe('prune method', () => {
	test('prune method deletes nothing when all lexemes is in use', async () => {
		const db = await dbPromise;
		const lexemes = new LexemesRegistry(db);

		await expect(lexemes.getList()).resolves.not.toHaveLength(0);
		await expect(lexemes.prune()).resolves.toEqual([]);
		await expect(lexemes.getList()).resolves.not.toHaveLength(0);
	});

	test('prune method deletes lexemes not in use', async () => {
		const db = await dbPromise;
		const notes = new NotesController(db, FAKE_WORKSPACE_ID);
		const lexemes = new LexemesRegistry(db);

		await expect(lexemes.getList()).resolves.toContain('2');
		await expect(lexemes.prune()).resolves.toEqual([]);

		const [note] = await notes.get({ search: { text: 'Title 2' } });
		expect(note).toHaveProperty('content.title', 'Title 2');

		await notes.delete([note.id]);
		await expect(lexemes.prune()).resolves.toEqual(['2']);
		await expect(lexemes.getList()).resolves.not.toContain('2');
		await expect(lexemes.getList()).resolves.toContain('1');
		await expect(lexemes.getList()).resolves.toContain('3');
	});
});

describe('Words scanner must find a new words after prune #147', () => {
	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	test('add few notes', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

		await Promise.all(
			Array(3)
				.fill(null)
				.map((_, index) =>
					registry.add({
						title: `Title ${index + 1}`,
						text: `Text ${index + 1}`,
					}),
				),
		);
	});

	test('index call after prune finds a new words', async () => {
		const db = await dbPromise;
		const lexemes = new LexemesRegistry(db);

		await expect(lexemes.getList()).resolves.toHaveLength(0);
		await expect(lexemes.prune()).resolves.toEqual([]);
		await expect(lexemes.getList()).resolves.toHaveLength(0);

		await expect(lexemes.index()).resolves.toEqual(['title', 'text', '3', '2', '1']);
		await expect(lexemes.getList()).resolves.not.toHaveLength(0);
	});
});
