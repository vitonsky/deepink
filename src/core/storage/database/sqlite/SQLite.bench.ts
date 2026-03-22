import { bench } from 'vitest';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { ManagedDatabase } from '../ManagedDatabase';
import { openSQLite } from './openSQLite';
import { SQLiteDatabase } from './SQLiteDatabase';
import { SQLiteDB } from '.';

const benchConfig = {
	iterations: 1,
	time: 0,
	warmupIterations: 0,
	warmupTime: 0,
};

describe('Open database', () => {
	const dbFile = createFileControllerMock();

	let db: ManagedDatabase<SQLiteDB>;
	bench(
		'Open database first time',
		async () => {
			db = await openSQLite(dbFile);
		},
		benchConfig,
	);

	bench(
		'Close database',
		async function () {
			await db.close();
		},
		benchConfig,
	);

	let db2: ManagedDatabase<SQLiteDB>;
	bench(
		'Open database second time',
		async () => {
			console.log('Bench');
			db2 = await openSQLite(dbFile);
		},
		{
			...benchConfig,
			async teardown(_task, mode) {
				if (mode !== 'run') return;
				await db2.close();
			},
		},
	);
});

describe('Insert data', async () => {
	const db = new SQLiteDatabase();

	await db.query(
		`CREATE TABLE notes (id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()), title TEXT NOT NULL, text TEXT NOT NULL)`,
	);

	bench(
		'Insert note text 10k chars',
		async () => {
			db.query(`INSERT INTO notes(title, text) VALUES(?, ?)`, [
				'Title',
				'A'.repeat(10_000),
			]);
		},
		{
			iterations: 1_000,
			time: 0,
			warmupIterations: 0,
			warmupTime: 0,
		},
	);

	bench(
		'Insert note text 100k chars',
		async () => {
			db.query(`INSERT INTO notes(title, text) VALUES(?, ?)`, [
				'Title',
				'A'.repeat(100_000),
			]);
		},
		{
			iterations: 1_000,
			time: 0,
			warmupIterations: 0,
			warmupTime: 0,
		},
	);
});
