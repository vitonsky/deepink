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
	{
		version: 4,
		up: async (db: MigrationsTarget) => {
			db.transaction(() => {
				db.exec(`CREATE TABLE "workspaces" (
					"id"	TEXT NOT NULL UNIQUE,
					"name"	TEXT NOT NULL,
					PRIMARY KEY("id")
					)`);
			})();
		},
	},
	{
		version: 5,
		up: async (db: MigrationsTarget) => {
			db.transaction(() => {
				db.exec(`CREATE TABLE "note_versions" (
					"id" TEXT NOT NULL UNIQUE,
					"note_id" TEXT NOT NULL,
					"created_at" INTEGER NOT NULL DEFAULT 0,
					"title" TEXT NOT NULL,
					"text" TEXT NOT NULL,
					PRIMARY KEY("id"),
					FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
				)`);
			})();
		},
	},
	{
		version: 6,
		up: async (db: MigrationsTarget) => {
			db.transaction(() => {
				db.exec(
					`ALTER TABLE "notes" ADD COLUMN "isSnapshotsDisabled" INTEGER NOT NULL DEFAULT 0;`,
				);
			})();
		},
	},
	{
		version: 7,
		up: async (db: MigrationsTarget) => {
			db.transaction(() => {
				db.exec(
					`ALTER TABLE "notes" ADD COLUMN "isVisible" INTEGER NOT NULL DEFAULT 1;`,
				);
			})();
		},
	},
] as const;

export const latestSchemaVersion = migrations[migrations.length - 1].version;

export const migrateToLatestSchema = async (db: MigrationsTarget, verbose = false) => {
	let currentVersion = Number(db.pragma('main.user_version', { simple: true }));

	if (verbose) {
		console.log('DB version', currentVersion);
	}

	// TODO: ensure sorted versions
	for (const migration of migrations) {
		if (currentVersion >= migration.version) continue;

		const nextVersion = migration.version;

		await migration.up(db);
		db.pragma(`main.user_version = ${nextVersion};`);

		currentVersion = nextVersion;

		if (verbose) {
			console.log('DB version updated to', currentVersion);
		}
	}
};
