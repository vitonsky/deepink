import { IFileController } from '@core/features/files';

export const openSQLite = async (file: IFileController) => {
	const getInitData = async () => {
		const initBuffer = await file.get();
		return initBuffer ? new Uint8Array(initBuffer) : null;
	};

	const isNode = typeof process !== 'undefined';
	const db = isNode
		? await import('./SQLiteDatabase').then(async ({ SQLiteDatabase }) => {
				return new SQLiteDatabase(await getInitData());
			})
		: await import('./SQLiteDatabaseWorker').then(
				async ({ SQLiteDatabaseWorker }) => {
					return new SQLiteDatabaseWorker(await getInitData());
				},
			);

	return db;
};
