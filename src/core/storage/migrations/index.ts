import { Database } from "sqlite";
import sqlite3 from 'sqlite3';

import { ExtendedSqliteDatabase } from "../ExtendedSqliteDatabase";

export type MigrationsTarget = Database<ExtendedSqliteDatabase, sqlite3.Statement>;

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
	},
	{
		version: 2,
		up: async (db: MigrationsTarget) => {
			await db.exec(`CREATE TABLE "attachments" (
				"id"	TEXT NOT NULL UNIQUE,
				"file"	TEXT NOT NULL,
				"note"	TEXT NOT NULL,
				PRIMARY KEY("id")
			)`);
		}
	},
	{
		version: 3,
		up: async (db: MigrationsTarget) => {
			await db.getDatabaseInstance().runBatch([
				{ sql: 'BEGIN TRANSACTION' },
				{ sql: 'DROP TABLE "attachments"' },
				{
					sql: `CREATE TABLE "attachments" (
						"id"	TEXT NOT NULL UNIQUE,
						"file"	TEXT NOT NULL,
						"note"	TEXT NOT NULL,
						PRIMARY KEY("id")
						UNIQUE(file,note)
						)` },
				{ sql: 'COMMIT' },
			]);
		}
	},
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