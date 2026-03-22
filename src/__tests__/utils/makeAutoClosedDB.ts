import { ManagedDatabase } from '@core/database/ManagedDatabase';
import { SQLiteDB } from '@core/database/sqlite';
import { openSQLite } from '@core/database/sqlite/openSQLite';
import { IFileController } from '@core/features/files';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

export const makeAutoClosedDB = ({
	file,
	closeHook = afterAll,
	clearFS,
}: {
	file?: IFileController;
	closeHook?: (callback: () => Promise<void>) => void;
	clearFS?: boolean;
} = {}) => {
	if (!file) {
		file = createFileControllerMock();
	}

	let dbPromise: Promise<ManagedDatabase<SQLiteDB>> | null = null;

	// Close and cleanup DB
	closeHook(async () => {
		if (!dbPromise) return;

		const db = await dbPromise;
		await db.close();
		dbPromise = null;

		if (clearFS) {
			file = createFileControllerMock();
		}
	});

	return {
		getDB() {
			if (!dbPromise) {
				if (!file) throw new Error('File is not set');
				dbPromise = openSQLite(file);
			}

			return dbPromise;
		},
	};
};
