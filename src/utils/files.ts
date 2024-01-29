import { existsSync, renameSync, rmSync } from 'fs';

import { copyFile, rm, writeFile } from 'fs/promises';

/**
 * Write file with 3-step transaction
 *
 * This util is not lock files, you have to implement it, to ensure conflict free
 */
export const writeFileAtomic = async (filename: string, content: Buffer | string) => {
	const backupFile = filename + '.backup';

	// Backup original file
	if (existsSync(filename)) {
		if (existsSync(backupFile)) {
			throw new Error(
				`Temporary backup file "${backupFile}" already exists. Can't to continue, to avoid loose data`,
			);
		}

		await copyFile(filename, backupFile);
	}

	// Write data
	await writeFile(filename, content);

	// Delete backup file, to commit transaction
	if (existsSync(backupFile)) {
		await rm(backupFile);
	}
};

/**
 * Recovery data from intermediate file
 *
 * Useful for cases when transaction been interrupted, to complete transaction
 */
export const recoveryAtomicFile = (filename: string) => {
	const backupFile = filename + '.backup';

	if (!existsSync(backupFile)) return false;

	// Preserve actual data from file to temporary file
	const tmpFile = filename + '.tmp';
	if (existsSync(filename)) {
		// Remove previous version
		if (existsSync(tmpFile)) {
			rmSync(tmpFile);
		}

		renameSync(filename, tmpFile);
	}

	// Recovery data
	renameSync(backupFile, filename);
	return true;
};
