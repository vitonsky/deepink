import { bench } from 'vitest';
import {
	openDatabase,
	PGLiteDatabase,
} from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

const benchConfig = {
	iterations: 1,
	time: 0,
	warmupIterations: 0,
	warmupTime: 0,
};

describe('Open database', () => {
	const dbFile = createFileControllerMock();

	let db: PGLiteDatabase;
	bench(
		'Open database first time',
		async () => {
			db = await openDatabase(dbFile);
		},
		benchConfig,
	);

	bench(
		'Close database',
		async function () {
			await db.close();
		},
		benchConfig,
	);

	let db2: PGLiteDatabase;
	bench(
		'Open database second time',
		async () => {
			console.log('Bench');
			db2 = await openDatabase(dbFile);
		},
		{
			...benchConfig,
			async teardown(_task, mode) {
				if (mode !== 'run') return;
				await db2.close();
			},
		},
	);
});
