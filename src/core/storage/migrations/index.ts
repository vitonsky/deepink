import { Database } from "sqlite";
import sqlite3 from 'sqlite3';

export type MigrationsTarget = Database<sqlite3.Database, sqlite3.Statement>;

const migrations = [
	{
		version: 1,
		up: async (db: MigrationsTarget) => {
			await db.exec(`CREATE TABLE "files" (
				"id"	TEXT NOT NULL UNIQUE,
				"name"	TEXT NOT NULL,
				"mimetype"	TEXT NOT NULL,
				PRIMARY KEY("id")
			)`);
		}
	}
] as const;

export const latestSchemaVersion = migrations[migrations.length - 1].version;

export const migrateToLatestSchema = async (db: MigrationsTarget) => {
	const response = await db.get('PRAGMA main.user_version');
	let currentVersion = response['user_version'];

	console.log('DB version', currentVersion);

	// TODO: ensure sorted versions
	for (const migration of migrations) {
		if (currentVersion >= migration.version) continue;

		const nextVersion = migration.version;

		await migration.up(db);
		await db.exec(`PRAGMA main.user_version = ${nextVersion};`);

		currentVersion = nextVersion;
	}
};