import { makeAutoClosedDB } from 'src/__tests__/utils/makeAutoClosedDB';
import { getUUID } from 'src/__tests__/utils/uuid';

import { AttachmentsController } from './AttachmentsController';

const { getDB } = makeAutoClosedDB();

test('basic usage', async () => {
	const db = await getDB();

	const NOTE1 = getUUID();
	const NOTE2 = getUUID();

	const TAG1 = getUUID();
	const TAG2 = getUUID();
	const TAG3 = getUUID();

	const attachments = new AttachmentsController(db, getUUID());
	await attachments.set(NOTE1, [TAG1, TAG2]);
	await attachments.set(NOTE2, [TAG1, TAG2, TAG3]);

	await attachments.get(NOTE2).then((attachedItems) => {
		expect(attachedItems).toEqual([TAG1, TAG2, TAG3]);
	});

	await attachments.delete([TAG3]);
	await attachments.get(NOTE2).then((attachedItems) => {
		expect(attachedItems).toEqual([TAG1, TAG2]);
	});

	await attachments.delete([TAG1, TAG2]);
	await attachments.get(NOTE2).then((attachedItems) => {
		expect(attachedItems).toEqual([]);
	});
});
