/* eslint-disable spellcheck/spell-checker */
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from './PGLiteDatabase';

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

describe('Database persistence', () => {
	const file = createFileControllerMock();

	test('Database must dump its content while closing', async () => {
		const dbContainer = await openDatabase(file);
		const db = dbContainer.get();

		await db.query(
			`CREATE TABLE demo_table (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), text TEXT NOT NULL)`,
		);
		await db.exec(
			`CREATE INDEX demo_table_trgm_idx ON demo_table USING GIST (text gist_trgm_ops(siglen=32));`,
		);

		for (const text of texts) {
			await db.query(`INSERT INTO demo_table(text) VALUES ($1)`, [text]);
		}

		await dbContainer.close();
	});

	test('Database must restore its data while initialization', async () => {
		const dbContainer = await openDatabase(file);
		const db = dbContainer.get();

		await expect(db.query('SELECT * FROM demo_table;')).resolves.toEqual(
			expect.objectContaining({
				rows: texts.map((text) => ({
					id: expect.any(String),
					text,
				})),
			}),
		);

		await dbContainer.close();
	});

	test('Database can fuzzy search', async () => {
		const dbContainer = await openDatabase(file);
		const db = dbContainer.get();

		await expect(
			db
				.query(
					'SELECT text, similarity(text, $1) as similarity FROM demo_table ORDER BY similarity DESC LIMIT 1',
					['A fox. Also it must be brown'],
				)
				.then((response) => (response.rows[0] as any)?.text),
			'Most similar text is above others',
		).resolves.toBe('The quick brown fox jumps over the lazy dog');

		await expect(
			db
				.query(
					'SELECT text, similarity(text, $1) as similarity FROM demo_table ORDER BY similarity DESC LIMIT 1',
					['bronw fox'],
				)
				.then((response) => (response.rows[0] as any)?.text),
			'Search is typo tolerant',
		).resolves.toBe('The quick brown fox jumps over the lazy dog');

		await expect(
			db
				.query(
					'SELECT text, similarity(text, $1) as similarity FROM demo_table ORDER BY similarity DESC LIMIT 3',
					['A fox. Also it must be red'],
				)
				.then((response) => response.rows),
			'First result is the most close and all results includes a "fox"',
		).resolves.toEqual([
			{
				text: 'The quick red fox jumped high above the hedge',
				similarity: expect.any(Number),
			},
			{
				text: expect.stringContaining('fox'),
				similarity: expect.any(Number),
			},
			{
				text: expect.stringContaining('fox'),
				similarity: expect.any(Number),
			},
		]);

		await dbContainer.close();
	});
});
