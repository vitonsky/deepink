import { getUUID } from 'src/__tests__/utils/uuid';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';
import { NotesController } from '../controller/NotesController';
import { DeletedNotesController } from './DeletedNotesController';
import ms from 'ms';

const FAKE_WORKSPACE_ID = getUUID();

const dbFile = createFileControllerMock();

vi.useFakeTimers();

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

describe('Service must delete expired notes', () => {
	test('Service deletes only expired notes just in time', async () => {
		vi.setSystemTime('2020-01-01T00:00:00.000Z');

		const dbFile = createFileControllerMock();
		const db = await openDatabase(dbFile);
		const notesController = new NotesController(db, FAKE_WORKSPACE_ID);
		const bin = new DeletedNotesController(
			{ notes: notesController },
			{ retentionTime: ms('1d'), considerModificationTime: true },
		);

		const onClean = vi.fn();
		const stopService = await bin.startService({ onClean });
		expect(onClean).toBeCalledTimes(0);

		// Create notes
		const noteIds = await createNotes(notesController, 100);
		expect(noteIds).toHaveLength(100);

		// Move to bin
		const notesToDelete = noteIds.slice(0, 50);
		await notesController.updateMeta(notesToDelete, { isDeleted: true });
		expect(onClean).toBeCalledTimes(0);

		// Nothing is deleted, since 1 second more left
		await vi.advanceTimersByTimeAsync(ms('23h') + ms('59m') + ms('59s'));
		expect(onClean).toBeCalledTimes(0);

		// Update data for slice of notes in bin
		const notesInBinToUpdate = notesToDelete.slice(0, 10);
		await Promise.all(
			notesInBinToUpdate.map((id) =>
				notesController.update(id, { title: '', text: '' }),
			),
		);

		// All notes that has not been updated must be deleted
		await vi.advanceTimersByTimeAsync(ms('1s'));
		expect(new Date().toISOString()).toBe('2020-01-02T00:00:00.000Z');
		expect(onClean).toHaveBeenLastCalledWith(40);
		expect(onClean).toBeCalledTimes(1);

		// Nothing is deleted, since 1 second more left
		await vi.advanceTimersByTimeAsync(ms('23h'));
		expect(onClean).toBeCalledTimes(1);

		// Restore notes
		await notesController.updateMeta(notesInBinToUpdate, { isDeleted: false });

		// Nothing to delete
		await vi.advanceTimersByTimeAsync(ms('1h'));
		expect(new Date().toISOString()).toBe('2020-01-03T00:00:00.000Z');
		expect(onClean).toBeCalledTimes(1);

		await vi.advanceTimersByTimeAsync(ms('1d'));
		expect(new Date().toISOString()).toBe('2020-01-04T00:00:00.000Z');
		expect(onClean).toBeCalledTimes(1);

		await vi.advanceTimersByTimeAsync(ms('1d'));
		expect(new Date().toISOString()).toBe('2020-01-05T00:00:00.000Z');
		expect(onClean).toBeCalledTimes(1);

		// Delete again
		await notesController.updateMeta(notesInBinToUpdate, { isDeleted: true });

		// 1 hour left
		await vi.advanceTimersByTimeAsync(ms('23h'));
		expect(new Date().toISOString()).toBe('2020-01-05T23:00:00.000Z');
		expect(onClean).toBeCalledTimes(1);

		// Delete expired notes
		await vi.advanceTimersByTimeAsync(ms('1h'));
		expect(new Date().toISOString()).toBe('2020-01-06T00:00:00.000Z');
		expect(onClean).toHaveBeenLastCalledWith(10);
		expect(onClean).toBeCalledTimes(2);

		await expect(stopService()).resolves.not.toThrow();

		await getNoteIds(notesController).then((notes) => {
			expect(notes).toEqual(noteIds.slice(50));
			expect(notes).toHaveLength(50);
		});
	});
});
