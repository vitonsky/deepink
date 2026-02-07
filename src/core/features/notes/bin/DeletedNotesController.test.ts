import { getUUID } from 'src/__tests__/utils/uuid';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';
import { NotesController } from '../controller/NotesController';
import { DeletedNotesController } from './DeletedNotesController';
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

describe('Purge expired notes', () => {
	test('Purge notes in bin that is deleted longer than retention time', async () => {
		const db = await openDatabase(dbFile);
		const notesController = new NotesController(db, FAKE_WORKSPACE_ID);
		const bin = new DeletedNotesController(
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

		await expect(bin.purgeExpired(), 'Expired notes has been deleted').resolves.toBe(
			50,
		);
		await expect(getNoteIds(notesController)).resolves.toEqual(slice1);

		// Update deletion time
		const slice2 = noteIds.slice(0, 30);

		vi.setSystemTime('2020-01-12T15:00:00.000Z');
		await notesController.updateMeta(slice2, { isDeleted: true });
		await expect(bin.purgeExpired(), 'No expired notes yet').resolves.toBe(0);

		vi.setSystemTime('2020-01-21T15:00:00.000Z');
		await expect(bin.purgeExpired(), 'Expired notes has been deleted').resolves.toBe(
			20,
		);
		await expect(getNoteIds(notesController)).resolves.toEqual(slice2);

		vi.setSystemTime('2020-01-22T15:00:00.000Z');
		await expect(bin.purgeExpired(), 'Expired notes has been deleted').resolves.toBe(
			30,
		);
		await expect(getNoteIds(notesController)).resolves.toEqual([]);
	});

	test('Modification time is considered when required', async () => {
		const db = await openDatabase(dbFile);
		const notesController = new NotesController(db, FAKE_WORKSPACE_ID);
		const bin = new DeletedNotesController(
			{ notes: notesController },
			{ retentionTime: ms('10d'), considerModificationTime: true },
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
		vi.setSystemTime('2020-01-11T15:00:00.000Z');

		const noteId = noteIds[0];
		await notesController.update(noteId, { title: '', text: '' });

		await expect(bin.purgeExpired(), 'Expired notes has been deleted').resolves.toBe(
			99,
		);
		await expect(getNoteIds(notesController)).resolves.toEqual([noteId]);

		vi.setSystemTime('2021-01-11T15:00:00.000Z');
		await notesController.update(noteId, { title: '', text: '' });
		await expect(bin.purgeExpired(), 'Nothing to purge').resolves.toBe(0);
		await expect(getNoteIds(notesController)).resolves.toEqual([noteId]);

		vi.setSystemTime('2021-01-20T15:00:00.000Z');
		await expect(bin.purgeExpired(), 'Nothing to purge').resolves.toBe(0);
		await expect(getNoteIds(notesController)).resolves.toEqual([noteId]);

		vi.setSystemTime('2021-01-21T15:00:00.000Z');
		await expect(bin.purgeExpired(), 'Retention policy is expired').resolves.toBe(1);
		await expect(getNoteIds(notesController)).resolves.toEqual([]);
	});
});

test('Empty bin', async () => {
	const db = await openDatabase(dbFile);
	const notesController = new NotesController(db, FAKE_WORKSPACE_ID);
	const bin = new DeletedNotesController(
		{ notes: notesController },
		{ retentionTime: ms('10d'), considerModificationTime: true },
	);

	// Create notes
	const noteIds = await createNotes(notesController, 100);
	expect(noteIds).toHaveLength(100);

	const sliceToDelete = noteIds.slice(0, 30);
	await getNoteIds(notesController).then((notes) => {
		expect(notes).toHaveLength(100);
		expect(notes).containSubset(sliceToDelete);
	});

	// Move to bin
	await notesController.updateMeta(sliceToDelete, { isDeleted: true });

	// Empty bin
	await expect(bin.empty()).resolves.toBe(30);
	await getNoteIds(notesController).then((notes) => {
		expect(notes).toHaveLength(70);
		expect(notes).not.containSubset(sliceToDelete);
	});

	await expect(bin.empty(), 'Bin is already empty').resolves.toBe(0);

	const restNotes = noteIds.slice(30);
	await notesController.updateMeta(restNotes, { isDeleted: true });

	const restoredNotes = restNotes.slice(0, 10);
	await notesController.updateMeta(restoredNotes, { isDeleted: false });

	// Empty bin
	await expect(bin.empty()).resolves.toBe(60);
	await getNoteIds(notesController).then((notes) => {
		expect(notes).toHaveLength(10);
		expect(notes).toEqual(restoredNotes);
	});
});
