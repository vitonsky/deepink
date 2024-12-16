import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from '../../storage/database/SQLiteDatabase/SQLiteDatabase';

import { WorkspacesController } from './WorkspacesController';

test('basic usage', async () => {
	const dbFile = createFileControllerMock();
	const db = await openDatabase(dbFile);

	const workspaces = new WorkspacesController(db);

	// Create
	const workspacesIds = await Promise.all([
		workspaces.create({ name: 'Workspace name' }),
		workspaces.create({ name: 'Workspace name' }),
	]);

	// Get one
	await expect(workspaces.get(workspacesIds[0])).resolves.toEqual({
		id: workspacesIds[0],
		name: 'Workspace name',
	});

	// Get list
	await expect(workspaces.getList()).resolves.toEqual(
		expect.arrayContaining(
			workspacesIds.map((id) =>
				expect.objectContaining({ id, name: 'Workspace name' }),
			),
		),
	);

	// Delete
	await expect(workspaces.delete([workspacesIds[0]])).resolves.toBeUndefined();
	await expect(workspaces.get(workspacesIds[0])).resolves.toBeNull();
	await expect(workspaces.getList()).resolves.toEqual(
		expect.arrayContaining([
			expect.objectContaining({ id: workspacesIds[1], name: 'Workspace name' }),
		]),
	);

	await db.close();
});

test('update workspace', async () => {
	const dbFile = createFileControllerMock();
	const db = await openDatabase(dbFile);

	const workspaces = new WorkspacesController(db);

	const id = await workspaces.create({ name: 'Workspace name' });
	expect(workspaces.get(id)).resolves.toEqual({
		id,
		name: 'Workspace name',
	});

	await workspaces.update(id, { name: 'Updated name' });
	expect(workspaces.get(id)).resolves.toEqual({
		id,
		name: 'Updated name',
	});

	await db.close();
});
