import { getUUID } from 'src/__tests__/utils/uuid';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';
import { NotesController } from '../notes/controller/NotesController';
import { TrashCleaner } from './TrashCleaner';
import ms from 'ms';

const FAKE_WORKSPACE_ID = getUUID();

const dbFile = createFileControllerMock();

const createNotes = async (notes: NotesController, count: number) =>
	Promise.all(
		Array(count)
			.fill(null)
			.map(() => notes.add({ title: '', text: '' })),
	);

const getNoteIds = async (notes: NotesController) =>
	notes.get().then((notes) => notes.map((note) => note.id));

test('Purge a notes in bin deleted later than retention time', async () => {
	const db = await openDatabase(dbFile);
	const notesController = new NotesController(db, FAKE_WORKSPACE_ID);
	const bin = new TrashCleaner(
		{ notes: notesController },
		{ retentionTime: ms('10d') },
	);

	// Create notes
	vi.setSystemTime('2020-01-01T15:00:00.000Z');
	const noteIds = await createNotes(notesController, 100);
	expect(noteIds).toHaveLength(100);

	// Move to bin
	await notesController.updateMeta(noteIds, { isDeleted: true });

	// Purge
	await expect(bin.purgeExpired(), 'Nothing to purge').resolves.toBe(0);

	vi.setSystemTime('2020-01-11T14:59:59.999Z');
	await expect(bin.purgeExpired(), 'No expired notes yet').resolves.toBe(0);

	// Update deletion time for part of notes
	const slice1 = noteIds.slice(0, 50);

	vi.setSystemTime('2020-01-11T15:00:00.000Z');
	await notesController.updateMeta(slice1, { isDeleted: true });

	await expect(bin.purgeExpired(), 'Expired notes has been deleted').resolves.toBe(50);
	await expect(getNoteIds(notesController)).resolves.toEqual(slice1);

	// Update deletion time
	const slice2 = noteIds.slice(0, 30);

	vi.setSystemTime('2020-01-12T15:00:00.000Z');
	await notesController.updateMeta(slice2, { isDeleted: true });
	await expect(bin.purgeExpired(), 'No expired notes yet').resolves.toBe(0);

	vi.setSystemTime('2020-01-21T15:00:00.000Z');
	await expect(bin.purgeExpired(), 'Expired notes has been deleted').resolves.toBe(20);
	await expect(getNoteIds(notesController)).resolves.toEqual(slice2);

	vi.setSystemTime('2020-01-22T15:00:00.000Z');
	await expect(bin.purgeExpired(), 'Expired notes has been deleted').resolves.toBe(30);
	await expect(getNoteIds(notesController)).resolves.toEqual([]);
});
