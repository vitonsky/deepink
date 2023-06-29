import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import lockfileUtils from 'proper-lockfile';
import { recoveryAtomicFile, writeFileAtomic } from '../../utils/files';

/**
 * Statements to create tables
 */
const schema = {
	notes: `CREATE TABLE "notes" (
		"id"	TEXT NOT NULL UNIQUE,
		"title"	TEXT NOT NULL,
		"text"	TEXT NOT NULL,
		"creationTime"	INTEGER NOT NULL DEFAULT 0,
		"lastUpdateTime"	INTEGER NOT NULL DEFAULT 0,
		PRIMARY KEY("id")
	)`
} as const;

export type SQLiteDb = {
	/**
	 * Configured database with extensions
	 */
	db: Database<sqlite3.Database, sqlite3.Statement>;

	/**
	 * Write database to file
	 * 
	 * DB automatically sync with updates, call this method to force sync
	 */
	sync: () => Promise<void>;
	close: () => Promise<void>;
};

type Options = {
	dbPath: string;
	dbExtensionsDir: string;

	/**
	 * Option to disable verbose logs
	 */
	verbose?: boolean;
};

export const getDb = async ({ dbPath, dbExtensionsDir, verbose: verboseLog = false }: Options): Promise<SQLiteDb> => {
	// Ensure changes applied for atomic file
	recoveryAtomicFile(dbPath);

	// Create DB
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
			const setupSQL = Object.values(schema).join(';\n');
			if (verboseLog) {
				console.info('Initialize DB');
				console.debug(setupSQL);
			}

			await db.exec(setupSQL);
		}

		return db;
	});

	// Sync changes
	let isRequiredSync = false;
	let currentSyncWorker: Promise<void> | null = null;
	const sync = async () => {
		const syncWorker = async () => {
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
				console.info('DB saved');
				console.debug({ dump });
			}

			await unlock();
		};

		// Return worker
		if (currentSyncWorker) {
			isRequiredSync = true;
			return currentSyncWorker;
		}

		// Create worker and wait
		currentSyncWorker = syncWorker();

		await currentSyncWorker;
		currentSyncWorker = null;

		// Run other sync worker and do not await
		if (isRequiredSync) {
			sync();
		}
	};

	// Auto sync changes
	let isHaveChangesFromLastCommit = false;
	db.on('trace', async (command: string) => {
		if (verboseLog) {
			console.debug(command);
		}

		// Track changes
		const isMutableCommand = ['INSERT', 'UPDATE', 'DELETE', 'DROP'].some(
			(commandName) => command.startsWith(commandName),
		);
		if (isMutableCommand) {
			isHaveChangesFromLastCommit = true;
			await sync();
		}

		// Sync by transaction operations
		const isCommit = command.endsWith('COMMIT');
		if (isCommit && isHaveChangesFromLastCommit) {
			isHaveChangesFromLastCommit = false;
			await sync();
		}
	});

	const close = async () => {
		await sync();
		await db.close();
	}

	return {
		db,
		sync,
		close
	};
};
