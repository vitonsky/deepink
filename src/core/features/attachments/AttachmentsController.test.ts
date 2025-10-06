import { makeAutoClosedDB } from 'src/__tests__/utils/makeAutoClosedDB';

import { AttachmentsController } from './AttachmentsController';

const { getDB } = makeAutoClosedDB();

test('basic usage', async () => {
	const db = await getDB();

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
});
