import { existsSync, renameSync } from 'fs';

import { rename, rm, writeFile } from 'fs/promises';

/**
 * Write file with 3-step transaction
 *
 * This util is not lock files, you have to implement it, to ensure conflict free
 */
export const writeFileAtomic = async (filename: string, content: Buffer | string) => {
	// Write tmp file. This operation will rewrite file if exists
	const tmpFile = filename + '.tmp';
	await writeFile(tmpFile, content);

	const backupFile = filename + '.backup';

	// Rename original file
	if (existsSync(filename)) {
		if (existsSync(backupFile)) {
			throw new Error(
				`Temporary backup file "${backupFile}" already exists. Can't to continue, to avoid loose data`,
			);
		}

		await rename(filename, backupFile);
	}

	// Rename temporary file, to original name
	await rename(tmpFile, filename);

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

	if (existsSync(filename)) return false;

	// Recovery data
	if (existsSync(backupFile)) {
		renameSync(backupFile, filename);
		return true;
	}

	return false;
};
