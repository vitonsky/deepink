import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from '../../storage/database/SQLiteDatabase/SQLiteDatabase';

import { AttachmentsController } from './AttachmentsController';

test('basic usage', async () => {
	const dbFile = createFileControllerMock();
	const db = await openDatabase(dbFile);

	const attachments = new AttachmentsController(db, 'fake-workspace-id');
	await attachments.set('target1', ['foo', 'bar']);
	await attachments.set('target2', ['foo', 'bar', 'qux']);

	await attachments.get('target2').then((attachedItems) => {
		expect(attachedItems).toEqual(['foo', 'bar', 'qux']);
	});

	await attachments.delete(['qux']);
	await attachments.get('target2').then((attachedItems) => {
		expect(attachedItems).toEqual(['foo', 'bar']);
	});

	await attachments.delete(['foo', 'bar']);
	await attachments.get('target2').then((attachedItems) => {
		expect(attachedItems).toEqual([]);
	});

	await db.close();
});
