import type { Migration } from 'ordinality';
import { PGlite } from '@electric-sql/pglite';

export type MigrationContext = {
	db: PGlite;
};

export type PGMigration = Migration<MigrationContext>;
