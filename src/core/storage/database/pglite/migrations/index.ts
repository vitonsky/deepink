import { PGMigration } from './types';

/**
 * Convert import from .sql file to a migration that run the SQL queries in transaction
 *
 * Transaction is automatically commit on success and roll back on error
 * @returns
 */
export async function convertSQLToMigrationObject(
	uid: string,
	module: Promise<typeof import('*.sql')>,
): Promise<PGMigration> {
	const { default: sql } = await module;

	return {
		uid,
		apply: async ({ context: { db } }) =>
			db.transaction(async (tx) => {
				await tx.exec(sql);
			}),
	};
}

export const getMigrationsList = async (): Promise<PGMigration[]> =>
	Promise.all([
		convertSQLToMigrationObject('1_init_db', import('./sql/1_init_db.sql')),
		convertSQLToMigrationObject(
			'2_full_text_search_for_notes',
			import('./sql/2_full_text_search_for_notes.sql'),
		),
		convertSQLToMigrationObject(
			'3_add_deleted_column_to_notes',
			import('./sql/3_add_deleted_column_to_notes.sql'),
		),
		convertSQLToMigrationObject(
			'4_add_unique_constraint_on_tags_name_parent',
			import('./sql/4_add_unique_constraint_on_tags_name_parent.sql'),
		),
		convertSQLToMigrationObject(
			'4_add_bookmarks_tab',
			import('./sql/2_add_bookmarks_tab.sql'),
		),
		convertSQLToMigrationObject(
			'3_add_archived_to_notes',
			import('./sql/3_add_archived_to_notes.sql'),
		),
	]);
