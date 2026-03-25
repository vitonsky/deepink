import { ManagedDatabase } from '@core/database/ManagedDatabase';
import { SQLiteDB } from '@core/database/sqlite';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';

export type TestValueCreatorConfig = { hook?: (callback: () => Promise<void>) => void };

const EmptyValue = Symbol();
export const makeTestValue = <T extends unknown>(
	creator: () => T | Promise<T>,
	{ hook = beforeAll }: TestValueCreatorConfig = {},
) => {
	const ref: { value: T } = { value: EmptyValue as any };
	hook(async () => {
		const result = await creator();
		ref.value = result;
	});

	return () => {
		if (ref.value === EmptyValue)
			throw new Error('The test value have not been initialized');
		return ref.value;
	};
};

export const createWorkspaceId = async (db: ManagedDatabase<SQLiteDB>) => {
	const controller = new WorkspacesController(db);
	return await controller.create({ name: 'test' });
};

export const makeAppContext = (
	getDB: () => Promise<ManagedDatabase<SQLiteDB>>,
	config?: TestValueCreatorConfig,
) => {
	return makeTestValue(async () => {
		const db = await getDB();
		const workspaceId = await createWorkspaceId(db);

		return { db, workspaceId };
	}, config);
};
