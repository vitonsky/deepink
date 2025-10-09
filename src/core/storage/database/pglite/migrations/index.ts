import { PGMigration } from './types';

/**
 * Convert import from .sql file to a migration that run the SQL queries in transaction
 *
 * Transaction is automatically commit on success and roll back on error
 * @returns
 */
export async function convertSQLToMigrationObject(
	name: string,
	module: Promise<typeof import('*.sql')>,
): Promise<PGMigration> {
	const { default: sql } = await module;

	return {
		name,
		up: async ({ context: { db } }) => db.transaction((tx) => tx.exec(sql)),
	};
}

export const getMigrationsList = async (): Promise<PGMigration[]> =>
	Promise.all([
		convertSQLToMigrationObject('1_init_db', import('./sql/1_init_db.sql')),
	]);
