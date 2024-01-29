import { tmpdir } from 'os';
import { tmpNameSync } from 'tmp';

import { openDatabase } from '../../storage/database/SQLiteDatabase/SQLiteDatabase';

import { Attachments } from './Attachments';

test('basic usage', async () => {
	const dbPath = tmpNameSync({ dir: tmpdir() });
	const db = await openDatabase(dbPath);

	const attachments = new Attachments(db);
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
