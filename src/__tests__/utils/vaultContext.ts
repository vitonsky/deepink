import { ManagedDatabase } from '@core/database/ManagedDatabase';
import { SQLiteDB } from '@core/database/sqlite';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';

import { createTestContext, TestValueCreatorConfig } from './createTestContext';
import { makeAutoClosedSQLiteDB } from './makeAutoClosedSQLiteDB';

export const createWorkspaceId = async (db: ManagedDatabase<SQLiteDB>) => {
	const controller = new WorkspacesController(db);
	return await controller.create({ name: 'test' });
};

/**
 * Create a context with the required workspace data
 */
export const createWorkspaceContext = ({
	getDB: dbFetcher,
	...config
}: TestValueCreatorConfig & {
	getDB?: () => Promise<ManagedDatabase<SQLiteDB>>;
} = {}) => {
	const getDB = dbFetcher || makeAutoClosedSQLiteDB().getDB;
	return createTestContext(async () => {
		const db = await getDB();
		const workspaceId = await createWorkspaceId(db);

		return { db, workspaceId };
	}, config);
};
