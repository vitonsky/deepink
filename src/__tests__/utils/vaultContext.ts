import { ManagedDatabase } from '@core/database/ManagedDatabase';
import { SQLiteDB } from '@core/database/sqlite';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';

import { createTestContext, TestValueCreatorConfig } from './createTestContext';

export const createWorkspaceId = async (db: ManagedDatabase<SQLiteDB>) => {
	const controller = new WorkspacesController(db);
	return await controller.create({ name: 'test' });
};

export const createWorkspaceContext = (
	getDB: () => Promise<ManagedDatabase<SQLiteDB>>,
	config?: TestValueCreatorConfig,
) => {
	return createTestContext(async () => {
		const db = await getDB();
		const workspaceId = await createWorkspaceId(db);

		return { db, workspaceId };
	}, config);
};
