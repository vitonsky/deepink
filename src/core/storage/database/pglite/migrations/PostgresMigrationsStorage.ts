import { MigrationParams, UmzugStorage } from 'umzug';

import { MigrationContext } from './types';

/**
 * Custom storage that persists migration names
 */
export class PostgresMigrationsStorage implements UmzugStorage<MigrationContext> {
	constructor(private readonly tableName = 'schema_migrations') {}

	async logMigration({
		name,
		context,
	}: MigrationParams<MigrationContext>): Promise<void> {
		await context.db.query(`INSERT INTO ${this.tableName} (name) VALUES ($1)`, [
			name,
		]);
	}

	async unlogMigration({
		name,
		context,
	}: MigrationParams<MigrationContext>): Promise<void> {
		await context.db.query(`DELETE FROM ${this.tableName} WHERE name=$1`, [name]);
	}

	async executed({
		context,
	}: Pick<MigrationParams<MigrationContext>, 'context'>): Promise<string[]> {
		await this.ensureTable(context);

		const { rows } = await context.db.query(
			`SELECT name FROM ${this.tableName} ORDER BY executed_at ASC`,
		);
		return rows.map((row: any) => row.name);
	}

	// ensure migrations table exists
	async ensureTable({ db }: MigrationContext) {
		await db.exec(
			`CREATE TABLE IF NOT EXISTS ${this.tableName} (
				id SERIAL PRIMARY KEY,
				name TEXT NOT NULL UNIQUE,
				executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
			);`,
		);
	}
}
