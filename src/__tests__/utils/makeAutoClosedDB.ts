import { IFileController } from '@core/features/files';
import {
	openDatabase,
	SQLiteDatabase,
} from '@core/storage/database/SQLiteDatabase/SQLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

export const makeAutoClosedDB = ({
	file,
	closeHook = afterAll,
}: {
	file?: IFileController;
	closeHook?: (callback: () => Promise<void>) => void;
} = {}) => {
	if (!file) {
		file = createFileControllerMock();
	}

	let dbPromise: Promise<SQLiteDatabase> | null = null;

	// Close and cleanup DB
	closeHook(async () => {
		if (!dbPromise) return;

		const db = await dbPromise;
		await db.close();
		dbPromise = null;
	});

	return {
		getDB() {
			if (!dbPromise) {
				dbPromise = openDatabase(file);
			}

			return dbPromise;
		},
	};
};
