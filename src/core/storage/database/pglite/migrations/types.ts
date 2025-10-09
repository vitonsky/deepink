import { RunnableMigration } from 'umzug';
import { PGlite } from '@electric-sql/pglite';

export type MigrationContext = {
	db: PGlite;
};

export type PGMigration = RunnableMigration<MigrationContext>;
