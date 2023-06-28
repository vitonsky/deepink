import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';
import { cwd } from 'process';
import { readFile, rename, rm, writeFile } from 'fs/promises';
import { existsSync, renameSync } from 'fs';
import lockfileUtils from 'proper-lockfile';

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

/**
 * Write file with 3-step transaction
 * 
 * This util is not lock files, you have to implement it, to ensure conflict free
 */
const writeFileAtomic = async (filename: string, content: Buffer | string) => {
	// Write tmp file. This operation will rewrite file if exists
	const tmpFile = filename + '.tmp';
	await writeFile(tmpFile, content);

	// Rename original file
	const backupFile = filename + '.backup';
	if (existsSync(backupFile)) {
		throw new Error(`Temporary backup file "${backupFile}" already exists. Can't to continue, to avoid loose data`);
	}
	await rename(filename, backupFile);

	// Rename temporary file, to original name
	await rename(tmpFile, filename);

	// Delete backup file, to commit transaction
	await rm(backupFile);
};

const recoveryAtomicFile = (filename: string) => {
	const backupFile = filename + '.backup';

	if (existsSync(filename)) return false;

	// Recovery data from intermediate file
	if (existsSync(backupFile)) {
		renameSync(backupFile, filename);
		return true;
	}

	return false;
};

export const getDb = async (dbName?: string): Promise<SQLiteDb> => {
	const profileDir = path.join(cwd(), 'tmp');
	const dbPath = path.join(profileDir, dbName ?? 'deepink.db');
	const verboseLog = false;

	// Ensure changes applied for atomic file
	recoveryAtomicFile(dbPath);

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
	let isRequiredSync = false;
	let isSyncInProgress = false;
	const sync = async () => {
		if (isSyncInProgress) {
			isRequiredSync = true;
			return;
		}

		isSyncInProgress = true;

		// Create empty file if not exists
		// It needs to create proper lock file
		if (!existsSync(dbPath)) {
			await writeFile(dbPath, '');
		}

		// Exit if sync in progress
		const isLocked = await lockfileUtils.check(dbPath);
		if (isLocked) {
			isRequiredSync = true;
			return;
		}

		const unlock = await lockfileUtils.lock(dbPath);

		isRequiredSync = false;
		const response = await db.get(`select dbdump();`);
		const dump = response['dbdump()'];

		if (!dump) {
			throw new Error('Dump are empty!');
		}

		// TODO: ensure dir exists
		// TODO: implement encryption before write

		// Write tmp file
		await writeFileAtomic(dbPath, dump);

		if (verboseLog) {
			console.log('Saved dump')
			console.log(dump);
		}

		await unlock();
		isSyncInProgress = false;

		console.log('DB synced');

		// Run sync process again and do not await
		if (isRequiredSync) {
			sync();
		}
	};

	return {
		db,
		sync,
	};
};
