import { getUUID } from 'src/__tests__/utils/uuid';
import { openSQLite } from '@core/storage/database/sqlite/openSQLite';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { NotesController } from './NotesController';

const FAKE_WORKSPACE_ID = getUUID();

vi.useFakeTimers();

test('filter by update time', async () => {
	const db = await openSQLite(createFileControllerMock());
	onTestFinished(db.close);

	const notes = new NotesController(db, FAKE_WORKSPACE_ID);

	vi.setSystemTime('01/01/2001 12:00');
	const note1 = await notes.add({ title: '2001', text: 'Dummy text' });

	vi.setSystemTime('01/01/2002 12:00');
	await notes.add({ title: '2002', text: 'Dummy text' });

	vi.setSystemTime('01/01/2003 12:00');
	await notes.add({ title: '2003', text: 'Dummy text' });

	// Filter by time
	await expect(
		notes.get({ updatedAt: { from: new Date('01/01/2002 12:00') } }),
	).resolves.toEqual([
		expect.objectContaining({ content: expect.objectContaining({ title: '2002' }) }),
		expect.objectContaining({ content: expect.objectContaining({ title: '2003' }) }),
	]);

	await expect(
		notes.get({ updatedAt: { to: new Date('01/01/2002 12:00') } }),
	).resolves.toEqual([
		expect.objectContaining({ content: expect.objectContaining({ title: '2001' }) }),
		expect.objectContaining({ content: expect.objectContaining({ title: '2002' }) }),
	]);

	// Update time and verify
	vi.setSystemTime('01/01/2005 12:00');
	await notes.update(note1, { title: '2005', text: 'Dummy text' });

	await expect(
		notes.get({ updatedAt: { to: new Date('01/01/2002 12:00') } }),
	).resolves.toEqual([
		expect.objectContaining({ content: expect.objectContaining({ title: '2002' }) }),
	]);

	await expect(
		notes.get({
			updatedAt: {
				from: new Date('01/01/2005 12:00'),
				to: new Date('01/01/2005 12:00'),
			},
		}),
	).resolves.toEqual([
		expect.objectContaining({ content: expect.objectContaining({ title: '2005' }) }),
	]);
});
