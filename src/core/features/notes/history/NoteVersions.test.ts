import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from '../../../storage/database/SQLiteDatabase/SQLiteDatabase';

import { NotesController } from '../controller/NotesController';
import { NoteVersions } from './NoteVersions';

describe('Snapshots of current note version', () => {
	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	test('create few notes', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, 'fake-workspace-id');

		await Promise.all(
			[
				{ title: 'Title 1', text: 'Text 1' },
				{ title: 'Title 2', text: 'Text 2' },
				{ title: 'Title 3', text: 'Text 3' },
			].map((note) => registry.add(note)),
		);
	});

	test('snapshot note', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, 'fake-workspace-id');
		const history = new NoteVersions(db, 'fake-workspace-id');

		// Fetch any note
		const notes = await registry.get();

		const noteDataV1 = notes[1];
		const noteId = noteDataV1.id;

		// No snapshots yet
		await expect(history.getList(noteId)).resolves.toHaveLength(0);

		// Make snapshot
		await history.snapshot(noteId);

		// Snapshot is created
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(noteDataV1.content),
		]);

		// Update note
		const contentV2 = { title: 'Modified title', text: 'Modified text' };
		await registry.update(noteId, contentV2);

		// Snapshot is not changed
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(noteDataV1.content),
		]);

		// Make another snapshot
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(contentV2),
			expect.objectContaining(noteDataV1.content),
		]);

		// Make another snapshot
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(contentV2),
			expect.objectContaining(contentV2),
			expect.objectContaining(noteDataV1.content),
		]);
	});

	test('history auto deleted when note is deleted', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, 'fake-workspace-id');
		const history = new NoteVersions(db, 'fake-workspace-id');

		// Fetch any note
		const notes = await registry.get();

		const noteId = notes[1].id;

		// Note have versions
		await expect(
			history.getList(noteId).then((object) => object.length),
		).resolves.toBeGreaterThan(0);

		// Note deletion also deletes all versions
		await registry.delete([noteId]);
		await expect(
			history.getList(noteId).then((object) => object.length),
		).resolves.toBe(0);
	});
});

describe('Delete note versions', () => {
	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	test('create few notes', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, 'fake-workspace-id');

		await Promise.all(
			[
				{ title: 'Title 1', text: 'Text 1' },
				{ title: 'Title 2', text: 'Text 2' },
				{ title: 'Title 3', text: 'Text 3' },
			].map((note) => registry.add(note)),
		);
	});

	test('purge all versions for note', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, 'fake-workspace-id');
		const history = new NoteVersions(db, 'fake-workspace-id');

		// Fetch any note
		const notes = await registry.get();
		const noteId = notes[1].id;

		// No versions for note
		await expect(history.getList(noteId)).resolves.toHaveLength(0);

		// Make snapshots
		await history.snapshot(noteId);
		await history.snapshot(noteId);
		await history.snapshot(noteId);

		// Note have versions
		await expect(history.getList(noteId)).resolves.toHaveLength(3);

		await history.purge(noteId);
		await expect(history.getList(noteId)).resolves.toHaveLength(0);
	});

	test('delete specific versions for note', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, 'fake-workspace-id');
		const history = new NoteVersions(db, 'fake-workspace-id');

		// Fetch any note
		const notes = await registry.get();
		const noteId = notes[1].id;

		// No versions for note
		await expect(history.getList(noteId)).resolves.toHaveLength(0);

		// Make snapshots
		await history.snapshot(noteId);
		await history.snapshot(noteId);
		await history.snapshot(noteId);

		// Versions now exists
		const versions1 = await history.getList(noteId);
		expect(versions1).toHaveLength(3);

		// Specific versions is exists
		const versionX = versions1[0];
		const versionY = versions1[1];
		expect(versions1).toContainEqual(versionX);
		expect(versions1).toContainEqual(versionY);

		// Deleted version must not to be in list
		await history.delete(versionY.id);

		const versions2 = await history.getList(noteId);
		expect(versions2).toHaveLength(2);
		expect(versions2).toContainEqual(versionX);
		expect(versions2).not.toContainEqual(versionY);

		// Another deleted version must not to be in list too
		await history.delete(versionX.id);

		const versions3 = await history.getList(noteId);
		expect(versions3).toHaveLength(1);
		expect(versions3).not.toContainEqual(versionX);
		expect(versions3).not.toContainEqual(versionY);
	});
});
