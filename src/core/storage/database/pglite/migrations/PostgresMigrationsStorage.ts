import { MigrationContext } from 'ordinality/Migration';
import { MigrationStorage } from 'ordinality/storage/MigrationStorage';
import { PGliteWorker } from '@electric-sql/pglite/worker';

/**
 * Custom storage that persists migration names
 */
export class PostgresMigrationsStorage<C extends MigrationContext<any, any>>
	implements MigrationStorage<C>
{
	constructor(
		private readonly db: PGliteWorker,
		private readonly tableName = 'schema_migrations',
	) {}

	async log(uid: string, _context: C): Promise<void> {
		await this.ensureTable();
		await this.db.query(`INSERT INTO ${this.tableName} (name) VALUES ($1)`, [uid]);
	}

	async unlog(uid: string, _context: C): Promise<void> {
		await this.ensureTable();
		await this.db.query(`DELETE FROM ${this.tableName} WHERE name=$1`, [uid]);
	}

	async list(): Promise<string[]> {
		await this.ensureTable();

		const { rows } = await this.db.query(
			`SELECT name FROM ${this.tableName} ORDER BY executed_at ASC`,
		);
		return rows.map((row: any) => row.name);
	}

	// ensure migrations table exists
	async ensureTable() {
		await this.db.exec(
			`CREATE TABLE IF NOT EXISTS ${this.tableName} (
				id SERIAL PRIMARY KEY,
				name TEXT NOT NULL UNIQUE,
				executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
			);`,
		);
	}
}
