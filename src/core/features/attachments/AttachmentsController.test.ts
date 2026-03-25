import { makeAutoClosedSQLiteDB } from '@tests/utils/makeAutoClosedSQLiteDB';
import { createWorkspaceContext } from '@tests/utils/vaultContext';

import { FilesController } from '../files/FilesController';
import { InMemoryFS } from '../files/InMemoryFS';
import { NotesController } from '../notes/controller/NotesController';
import { AttachmentsController } from './AttachmentsController';

const { getDB } = makeAutoClosedSQLiteDB();
const getAppContext = createWorkspaceContext(getDB);

test('basic usage', async () => {
	const { db, workspaceId } = getAppContext();

	const notes = new NotesController(db, workspaceId);
	const files = new FilesController(db, new InMemoryFS(), workspaceId);

	const [NOTE1, NOTE2] = await Promise.all([
		notes.add({ title: '', text: '' }),
		notes.add({ title: '', text: '' }),
	]);
	const [FILE_1, FILE_2, FILE_3] = await Promise.all([
		files.add(new File([], 'filename')),
		files.add(new File([], 'filename')),
		files.add(new File([], 'filename')),
	]);

	const attachments = new AttachmentsController(db, workspaceId);
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
