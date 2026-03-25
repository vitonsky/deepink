/* eslint-disable @cspell/spellchecker */
import { makeAppContext } from 'src/__tests__/utils/makeAppContext';
import { makeAutoClosedSQLiteDB } from 'src/__tests__/utils/makeAutoClosedSQLiteDB';
import z from 'zod';
import { FlexSearchIndex } from '@core/database/flexsearch/FlexSearchIndex';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { StateFile } from '@core/features/files/StateFile';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { NotesController } from './NotesController';
import { NotesTextIndexer } from './NotesTextIndexer';

const { getDB } = makeAutoClosedSQLiteDB();
const getAppContext = makeAppContext(getDB);

const index = new FlexSearchIndex(new InMemoryFS());

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

let tagsMap: Record<string, string>;
beforeAll(async () => {
	const { db, workspaceId } = getAppContext();
	const registry = new NotesController(db, workspaceId);
	const tags = new TagsController(db, workspaceId);

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

test('Update index', async () => {
	const { db, workspaceId } = getAppContext();
	const registry = new NotesController(db, workspaceId);

	const indexScanner = new NotesTextIndexer(
		registry,
		index,
		new StateFile(createFileControllerMock(), z.any()),
	);
	await expect(indexScanner.update()).resolves.toBeGreaterThan(0);
});

test('Search by text', async () => {
	const { db, workspaceId } = getAppContext();
	const registry = new NotesController(db, workspaceId, index);

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
	const { db, workspaceId } = getAppContext();
	const registry = new NotesController(db, workspaceId, index);

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
