import { makeAutoClosedDB } from 'src/__tests__/utils/makeAutoClosedDB';
import { Mock } from 'vitest';

import { WorkspacesController } from './WorkspacesController';
import { WorkspacesControllerSync } from './WorkspacesControllerSync';

const { getDB } = makeAutoClosedDB();

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('WorkspacesControllerSync methods trigger sync', () => {
	let syncMock: Mock<() => Promise<void>>;
	let workspacesSync: WorkspacesControllerSync;
	let workspaceId: string;

	beforeEach(async () => {
		const db = await getDB();
		syncMock = vi.spyOn(db, 'sync');

		workspacesSync = new WorkspacesControllerSync(new WorkspacesController(db), db);
		workspaceId = await workspacesSync.create({ name: 'My work' });

		syncMock.mockClear();
	});

	test('create trigger sync', async () => {
		await workspacesSync.create({ name: 'My work' });

		expect(syncMock).toHaveBeenCalledOnce();
	});

	test('delete triggers sync', async () => {
		await workspacesSync.delete([workspaceId]);

		expect(syncMock).toHaveBeenCalledOnce();
	});

	test('update triggers sync', async () => {
		await workspacesSync.update(workspaceId, { name: 'Work again' });

		expect(syncMock).toHaveBeenCalledOnce();
	});
});
