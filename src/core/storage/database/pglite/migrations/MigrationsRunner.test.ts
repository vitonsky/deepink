/* eslint-disable spellcheck/spell-checker */
import { PGlite } from '@electric-sql/pglite';

import { MigrationsRunner } from './MigrationsRunner';
import { PostgresMigrationsStorage } from './PostgresMigrationsStorage';
import { convertSQLToMigrationObject } from '.';

describe('Migrations run in strict order', () => {
	const db = new PGlite();
	const storage = new PostgresMigrationsStorage();

	test('All migrations must be applied for empty storage', async () => {
		const migrator = new MigrationsRunner({
			storage,
			migrations: [
				{ name: 'foo', async up() {} },
				{ name: 'bar', async up() {} },
				{ name: 'baz', async up() {} },
			],
			context: { db },
			logger: console,
		});

		await expect(migrator.up()).resolves.toEqual([
			expect.objectContaining({ name: 'foo' }),
			expect.objectContaining({ name: 'bar' }),
			expect.objectContaining({ name: 'baz' }),
		]);
	});

	test('Migrations must be applied only once', async () => {
		const migrator = new MigrationsRunner({
			storage,
			migrations: [
				{ name: 'foo', async up() {} },
				{ name: 'bar', async up() {} },
				{ name: 'baz', async up() {} },
			],
			context: { db },
			logger: console,
		});

		await expect(migrator.up()).resolves.toEqual([]);
	});

	test('Migrations order must be the same for list to apply and for an executed migrations', async () => {
		await expect(
			new MigrationsRunner({
				storage,
				migrations: [
					{ name: 'baz', async up() {} },
					{ name: 'foo', async up() {} },
					{ name: 'bar', async up() {} },
				],
				context: { db },
				logger: console,
			}).up(),
		).rejects.toThrowError(
			'Names of applied migration "foo" and migration at index 0 is not match. Wrong order of migrations list?',
		);

		await expect(
			new MigrationsRunner({
				storage,
				migrations: [
					{ name: 'foo', async up() {} },
					{ name: 'baz', async up() {} },
					{ name: 'bar', async up() {} },
				],
				context: { db },
				logger: console,
			}).up(),
		).rejects.toThrowError(
			'Names of applied migration "bar" and migration at index 1 is not match. Wrong order of migrations list?',
		);
	});

	test('Migrations list must have all applied migrations', async () => {
		await expect(
			new MigrationsRunner({
				storage,
				migrations: [
					{ name: 'foo', async up() {} },
					{ name: 'bar', async up() {} },
				],
				context: { db },
				logger: console,
			}).up(),
		).rejects.toThrowError(
			'Migrations list miss a migration "baz" at index 2. Incomplete migrations list 2/3',
		);

		await expect(
			new MigrationsRunner({
				storage,
				migrations: [],
				context: { db },
				logger: console,
			}).up(),
		).rejects.toThrowError(
			'Migrations list miss a migration "foo" at index 0. Incomplete migrations list 0/3',
		);
	});
});

describe.only('Migrations runs in transactions', () => {
	const db = new PGlite();
	const storage = new PostgresMigrationsStorage();

	test('Fail at first migration must stop migration process', async () => {
		await expect(
			new MigrationsRunner({
				storage,
				migrations: await Promise.all([
					convertSQLToMigrationObject(
						'invalid-transaction',
						Promise.resolve({ default: 'select nonexists' }),
					),
					convertSQLToMigrationObject(
						'bar',
						Promise.resolve({ default: 'SELECT NOW();' }),
					),
				]),
				context: { db },
				logger: console,
			}).up(),
		).rejects.toThrowError(
			'Migration invalid-transaction (up) failed: Original error: column "nonexists" does not exist',
		);

		await expect(storage.executed({ context: { db } })).resolves.toEqual([]);
	});

	describe('Transactions are atomic and applies one by one', () => {
		test('Error in transaction rejects only specific transaction', async () => {
			await expect(
				new MigrationsRunner({
					storage,
					migrations: await Promise.all([
						convertSQLToMigrationObject(
							'foo',
							Promise.resolve({
								default: `CREATE TABLE test (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), text TEXT NOT NULL)`,
							}),
						),
						convertSQLToMigrationObject(
							'bar',
							Promise.resolve({
								default: `INSERT INTO test(text) VALUES ('Hello world')`,
							}),
						),
						convertSQLToMigrationObject(
							'baz',
							Promise.resolve({
								default: 'DROP TABLE test; select invalid_fn()',
							}),
						),
						convertSQLToMigrationObject(
							'qux',
							Promise.resolve({ default: 'SELECT NOW();' }),
						),
					]),
					context: { db },
					logger: console,
				}).up(),
			).rejects.toThrowError(
				'Migration baz (up) failed: Original error: function invalid_fn() does not exist',
			);

			// Only 2 valid migrations is executed
			await expect(storage.executed({ context: { db } })).resolves.toEqual([
				'foo',
				'bar',
			]);

			// Table was not dropped and does exist
			await expect(db.query('SELECT * FROM test')).resolves.toEqual(
				expect.objectContaining({
					rows: [expect.objectContaining({ text: 'Hello world' })],
				}),
			);
		});

		test('Once transaction is fixed, it may be applied', async () => {
			await expect(
				new MigrationsRunner({
					storage,
					migrations: await Promise.all([
						convertSQLToMigrationObject(
							'foo',
							Promise.resolve({ default: 'SELECT NOW();' }),
						),
						convertSQLToMigrationObject(
							'bar',
							Promise.resolve({ default: 'SELECT NOW();' }),
						),
						convertSQLToMigrationObject(
							'baz',
							Promise.resolve({ default: 'SELECT NOW();' }),
						),
						convertSQLToMigrationObject(
							'qux',
							Promise.resolve({ default: 'SELECT NOW();' }),
						),
					]),
					context: { db },
					logger: console,
				}).up(),
			).resolves.toEqual([
				expect.objectContaining({ name: 'baz' }),
				expect.objectContaining({ name: 'qux' }),
			]);

			await expect(storage.executed({ context: { db } })).resolves.toEqual([
				'foo',
				'bar',
				'baz',
				'qux',
			]);
		});
	});
});
