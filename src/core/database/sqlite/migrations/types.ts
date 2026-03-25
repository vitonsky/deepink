import type { Migration } from 'ordinality';

import { SQLiteDB } from '..';

export type SQLiteMigrationContext = {
	db: SQLiteDB;
};

export type SQLiteMigration = Migration<SQLiteMigrationContext>;
