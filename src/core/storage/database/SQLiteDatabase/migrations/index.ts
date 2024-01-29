import { Database } from 'better-sqlite3';

export type MigrationsTarget = Database;

const migrations = [
	{
		version: 1,
		up: async (db: MigrationsTarget) => {
			db.exec(`CREATE TABLE "files" (
				"id"	TEXT NOT NULL UNIQUE,
				"name"	TEXT NOT NULL,
				"mimetype"	TEXT NOT NULL,
				PRIMARY KEY("id")
			)`);
		},
	},
	{
		version: 2,
		up: async (db: MigrationsTarget) => {
			db.exec(`CREATE TABLE "attachments" (
				"id"	TEXT NOT NULL UNIQUE,
				"file"	TEXT NOT NULL,
				"note"	TEXT NOT NULL,
				PRIMARY KEY("id")
			)`);
		},
	},
	{
		version: 3,
		up: async (db: MigrationsTarget) => {
			db.transaction(() => {
				db.exec('DROP TABLE "attachments"');
				db.exec(`CREATE TABLE "attachments" (
					"id"	TEXT NOT NULL UNIQUE,
					"file"	TEXT NOT NULL,
					"note"	TEXT NOT NULL,
					PRIMARY KEY("id")
					UNIQUE(file,note)
					)`);
			})();
		},
	},
] as const;

export const latestSchemaVersion = migrations[migrations.length - 1].version;

export const migrateToLatestSchema = async (db: MigrationsTarget) => {
	let currentVersion = Number(db.pragma('main.user_version', { simple: true }));

	console.log('DB version', currentVersion);

	// TODO: ensure sorted versions
	for (const migration of migrations) {
		if (currentVersion >= migration.version) continue;

		const nextVersion = migration.version;

		await migration.up(db);
		db.pragma(`main.user_version = ${nextVersion};`);

		currentVersion = nextVersion;
	}
};
