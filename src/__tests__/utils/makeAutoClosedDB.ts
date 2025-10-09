import { IFileController } from '@core/features/files';
import {
	openDatabase,
	PGLiteDatabase,
} from '@core/storage/database/pglite/PGLiteDatabase';
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

	let dbPromise: Promise<PGLiteDatabase> | null = null;

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
				dbPromise = openDatabase(file);
			}

			return dbPromise;
		},
	};
};
