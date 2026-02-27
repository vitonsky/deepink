import { makeAutoClosedDB } from 'src/__tests__/utils/makeAutoClosedDB';

import { WorkspacesController } from './WorkspacesController';
import { WorkspacesControllerSync } from './WorkspacesControllerSync';

const { getDB } = makeAutoClosedDB();

beforeEach(() => {
	vi.restoreAllMocks();
});

test('Called synchronization after create', async () => {
	const db = await getDB();
	const syncMock = vi.spyOn(db, 'sync');

	const workspacesSync = new WorkspacesControllerSync(new WorkspacesController(db), db);
	await workspacesSync.create({ name: 'test' });

	expect(syncMock).toHaveBeenCalledOnce();
});

test('Called synchronization after delete', async () => {
	const db = await getDB();
	const syncMock = vi.spyOn(db, 'sync');

	const workspacesSync = new WorkspacesControllerSync(new WorkspacesController(db), db);
	const workspaceId = await workspacesSync.create({ name: 'test' });
	expect(workspaceId).toBeDefined();

	await workspacesSync.delete([workspaceId]);

	expect(syncMock).toHaveBeenCalledTimes(2);
});
