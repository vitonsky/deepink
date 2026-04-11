import { wrap } from 'comlink';

import { SQLiteDBWorker } from '.';

test('supports init -> close -> init lifecycle', async () => {
	const worker = new Worker(new URL('./SQLiteDatabase.worker', import.meta.url), {
		type: 'module',
	});

	onTestFinished(() => worker.terminate());

	const workerApi = wrap<SQLiteDBWorker>(worker);

	await workerApi.init(null);
	await workerApi.close();

	await expect(workerApi.init(null)).resolves.toBeUndefined();
});
