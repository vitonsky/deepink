import { MigrationContext } from 'ordinality/Migration';
import { MigrationStorage } from 'ordinality/storage/MigrationStorage';
import z from 'zod';

import { SQLiteDB } from '..';

/**
 * Custom storage that persists migration names
 */
export class SQLiteMigrationsStorage<
	C extends MigrationContext<any, any>,
> implements MigrationStorage<C> {
	constructor(
		private readonly db: SQLiteDB,
		private readonly tableName = 'schema_migrations',
	) {}

	async log(uid: string, _context: C): Promise<void> {
		await this.ensureTable();
		await this.db.query(`INSERT INTO ${this.tableName} (name) VALUES (?)`, [uid]);
	}

	async unlog(uid: string, _context: C): Promise<void> {
		await this.ensureTable();
		await this.db.query(`DELETE FROM ${this.tableName} WHERE name=?`, [uid]);
	}

	async list(): Promise<string[]> {
		await this.ensureTable();

		const rows = await this.db.query(
			`SELECT name FROM ${this.tableName} ORDER BY executed_at ASC`,
		);
		return z
			.object({ name: z.string() })
			.transform((r) => r.name)
			.array()
			.parse(rows);
	}

	// ensure migrations table exists
	async ensureTable() {
		await this.db.query(
			`CREATE TABLE IF NOT EXISTS ${this.tableName} (
				id          INTEGER PRIMARY KEY AUTOINCREMENT,
				name        TEXT NOT NULL,
				executed_at INTEGER NOT NULL DEFAULT (timestamp('now'))
			);`,
		);
	}
}
