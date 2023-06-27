import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';
import { cwd } from 'process';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const notesStatement = `CREATE TABLE "notes" (
	"id"	TEXT NOT NULL UNIQUE,
	"title"	TEXT NOT NULL,
	"text"	TEXT NOT NULL,
	"creationTime"	INTEGER NOT NULL DEFAULT 0,
	"lastUpdateTime"	INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY("id")
)`;

// TODO: change path to it works after packing
const dbExtensionsDir = path.join(cwd(), 'dist/sqliteExtensions');

export type SQLiteDb = {
	/**
	 * Configured database with extensions
	 */
	db: Database<sqlite3.Database, sqlite3.Statement>;

	/**
	 * Write database to file
	 */
	sync: () => Promise<void>;
};

export const getDb = async (dbName?: string): Promise<SQLiteDb> => {
	const dbPath = path.join(cwd(), dbName ?? 'tmp/db.dump');
	const verboseLog = false;

	const db = await open({
		filename: ':memory:',
		driver: sqlite3.Database,
	}).then(async (db) => {
		// TODO: add extension files for all platforms
		// Setup extensions
		await db.loadExtension(path.join(dbExtensionsDir, 'uuid'));
		await db.loadExtension(path.join(dbExtensionsDir, 'dbdump'));

		if (existsSync(dbPath)) {
			// Load DB
			// TODO: implement decryption
			const dumpSQL = await readFile(dbPath, 'utf-8');
			await db.exec(dumpSQL);
		} else {
			// Create DB
			await db.exec(notesStatement);
		}

		return db;
	});

	// TODO: listen DB updates and automatically sync file
	const sync = async () => {
		const response = await db.get(`select dbdump();`);
		const dump = response['dbdump()'];

		if (!dump) {
			throw new Error('Dump are empty!');
		}

		// TODO: ensure file exists
		// TODO: implement encryption before write
		await writeFile(dbPath, dump);

		if (verboseLog) {
			console.log('Saved dump')
			console.log(dump);
		}
	};

	return {
		db,
		sync,
	};
};
