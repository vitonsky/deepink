import { MigrationRunner } from 'ordinality';

import { SQLiteDatabase } from '../SQLiteDatabase';
import { SQLiteMigrationsStorage } from './SQLiteMigrationsStorage';
import { convertSQLToMigrationObject } from '.';

const createMigrations = async (migrations: { id: string; sql: string }[]) =>
	Promise.all(
		migrations.map((migration) =>
			convertSQLToMigrationObject(
				migration.id,
				Promise.resolve({
					default: migration.sql,
				}),
			),
		),
	);

describe('Iterative migrations application', () => {
	const db = new SQLiteDatabase();

	test('Apply initial migrations', async () => {
		const migrations = new MigrationRunner({
			context: { db },
			storage: new SQLiteMigrationsStorage(db),
			migrations: await createMigrations([
				{
					id: 'add_notes_table',
					sql: `CREATE TABLE notes (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						title TEXT NOT NULL,
						text TEXT NOT NULL
					);`,
				},
				{
					id: 'add note #1',
					sql: `INSERT INTO notes (title, text) VALUES('#1', '');`,
				},
			]),
		});

		await expect(migrations.up()).resolves.toEqual([
			'add_notes_table',
			'add note #1',
		]);
	});

	test('Failed migrations must be rolled back', async () => {
		const migrations = new MigrationRunner({
			context: { db },
			storage: new SQLiteMigrationsStorage(db),
			migrations: await createMigrations([
				{
					id: 'add_notes_table',
					sql: `CREATE TABLE notes (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						title TEXT NOT NULL,
						text TEXT NOT NULL
					);`,
				},
				{
					id: 'add note #1',
					sql: `INSERT INTO notes (title, text) VALUES('#1', '');`,
				},
				{
					id: 'add note #2',
					sql: `INSERT INTO notes (title, text) VALUES('#2', '');`,
				},
				{
					id: 'invalid migration',
					sql: `DROP TABLE notes; INSERT INTO notes (title, text) VALUES('', 'Invalid operation');`,
				},
			]),
		});

		await expect(migrations.executed()).resolves.toEqual([
			'add_notes_table',
			'add note #1',
		]);
		await expect(migrations.up()).rejects.toThrow('no such table: notes');
		await expect(migrations.executed()).resolves.toEqual([
			'add_notes_table',
			'add note #1',
			'add note #2',
		]);

		await expect(
			db.query('SELECT count(*) as count FROM notes'),
			'Table is not dropped',
		).resolves.toContainEqual({ count: 2 });
	});

	test('Migrations may be applied after fail', async () => {
		const migrations = new MigrationRunner({
			context: { db },
			storage: new SQLiteMigrationsStorage(db),
			migrations: await createMigrations([
				{
					id: 'add_notes_table',
					sql: `CREATE TABLE notes (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						title TEXT NOT NULL,
						text TEXT NOT NULL
					);`,
				},
				{
					id: 'add note #1',
					sql: `INSERT INTO notes (title, text) VALUES('#1', '');`,
				},
				{
					id: 'add note #2',
					sql: `INSERT INTO notes (title, text) VALUES('#2', '');`,
				},
				{
					id: 'add note #3',
					sql: `INSERT INTO notes (title, text) VALUES('#3', '');`,
				},
			]),
		});

		await expect(migrations.executed()).resolves.toEqual([
			'add_notes_table',
			'add note #1',
			'add note #2',
		]);
		await expect(migrations.up()).resolves.toEqual(['add note #3']);
		await expect(migrations.executed()).resolves.toEqual([
			'add_notes_table',
			'add note #1',
			'add note #2',
			'add note #3',
		]);
	});
});
