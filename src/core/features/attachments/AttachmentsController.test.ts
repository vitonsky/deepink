import { makeAutoClosedDB } from 'src/__tests__/utils/makeAutoClosedDB';
import { getUUID } from 'src/__tests__/utils/uuid';

import { FilesController } from '../files/FilesController';
import { InMemoryFS } from '../files/InMemoryFS';
import { NotesController } from '../notes/controller/NotesController';
import { AttachmentsController } from './AttachmentsController';

const { getDB } = makeAutoClosedDB();

test('basic usage', async () => {
	const db = await getDB();

	const FAKE_WORKSPACE_ID = getUUID();

	const notes = new NotesController(db, FAKE_WORKSPACE_ID);
	const files = new FilesController(db, new InMemoryFS(), FAKE_WORKSPACE_ID);

	const [NOTE1, NOTE2] = await Promise.all([
		notes.add({ title: '', text: '' }),
		notes.add({ title: '', text: '' }),
	]);
	const [FILE_1, FILE_2, FILE_3] = await Promise.all([
		files.add(new File([], 'filename')),
		files.add(new File([], 'filename')),
		files.add(new File([], 'filename')),
	]);

	const attachments = new AttachmentsController(db, FAKE_WORKSPACE_ID);
	await attachments.set(NOTE1, [FILE_1, FILE_2]);
	await attachments.set(NOTE2, [FILE_1, FILE_2, FILE_3]);

	await attachments.get(NOTE2).then((attachedItems) => {
		expect(attachedItems).toEqual([FILE_1, FILE_2, FILE_3]);
	});

	await attachments.delete([FILE_3]);
	await attachments.get(NOTE2).then((attachedItems) => {
		expect(attachedItems).toEqual([FILE_1, FILE_2]);
	});

	await attachments.delete([FILE_1, FILE_2]);
	await attachments.get(NOTE2).then((attachedItems) => {
		expect(attachedItems).toEqual([]);
	});
});
