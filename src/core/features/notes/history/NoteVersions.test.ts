import { getUUID } from 'src/__tests__/utils/uuid';
import { openDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { NotesController } from '../controller/NotesController';
import { NoteVersions } from './NoteVersions';

const FAKE_WORKSPACE_ID = getUUID();

describe('Note version control', () => {
	const dbFile = createFileControllerMock();
	const dbPromise = openDatabase(dbFile);

	afterAll(async () => {
		const db = await dbPromise;
		await db.close();
	});

	test('snapshot must be created only if latest version have changes with latest note data', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);
		const history = new NoteVersions(db, FAKE_WORKSPACE_ID);

		// Fetch note
		const dataV1 = { title: 'Title', text: 'Text' };
		const noteId = await registry.add(dataV1);

		// No snapshots yet
		await expect(history.getList(noteId)).resolves.toHaveLength(0);

		// Make snapshot
		await history.snapshot(noteId);

		// Snapshot is created
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV1),
		]);

		// Any calls for snapshot creation must be ignored
		// since no changes with latest snapshot
		await history.snapshot(noteId);
		await history.snapshot(noteId);
		await history.snapshot(noteId);

		await expect(history.getList(noteId)).resolves.toHaveLength(1);

		// Update note
		const dataV2 = { title: 'Modified title', text: 'Modified text' };
		await registry.update(noteId, dataV2);

		// Make another snapshot
		await history.snapshot(noteId);

		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV2),
			expect.objectContaining(dataV1),
		]);
	});

	test('snapshot must always be created when parameter `force` is set', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);
		const history = new NoteVersions(db, FAKE_WORKSPACE_ID);

		// Fetch note
		const noteId = await registry.add({ title: 'Title 1', text: 'Text 1' });
		const noteDataV1 = (await registry.getById([noteId]))[0]!;

		// No snapshots yet
		await expect(history.getList(noteId)).resolves.toHaveLength(0);

		// Make snapshot
		await history.snapshot(noteId, { force: true });

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
		await history.snapshot(noteId, { force: true });
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(contentV2),
			expect.objectContaining(noteDataV1.content),
		]);

		// Make another snapshot
		await history.snapshot(noteId, { force: true });
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(contentV2),
			expect.objectContaining(contentV2),
			expect.objectContaining(noteDataV1.content),
		]);
	});

	test('when note is deleted, all versions must be deleted too', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);
		const history = new NoteVersions(db, FAKE_WORKSPACE_ID);

		// Fetch note
		const noteId = await registry.add({ title: 'Title 1', text: 'Text 1' });

		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });

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

	test('snapshot may be created with empty text', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);
		const history = new NoteVersions(db, FAKE_WORKSPACE_ID);

		// Fetch note
		const dataV1 = { title: '', text: '' };
		const noteId = await registry.add(dataV1);

		// Make snapshot
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV1),
		]);

		// Next snapshot calls will be ignored, since no changes
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV1),
		]);

		// Update note
		const dataV2 = { title: 'Modified title', text: 'Modified text' };
		await registry.update(noteId, dataV2);

		// Make another snapshot
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV2),
			expect.objectContaining(dataV1),
		]);

		// Update note with empty text
		const dataV3 = { title: '', text: '' };
		await registry.update(noteId, dataV3);

		// Make another snapshot
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV3),
			expect.objectContaining(dataV2),
			expect.objectContaining(dataV1),
		]);
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
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);

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
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);
		const history = new NoteVersions(db, FAKE_WORKSPACE_ID);

		// Fetch any note
		const notes = await registry.get();
		const noteId = notes[1].id;

		// No versions for note
		await expect(history.getList(noteId)).resolves.toHaveLength(0);

		// Make snapshots
		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });

		// Note have versions
		await expect(history.getList(noteId)).resolves.toHaveLength(3);

		await history.purge([noteId]);
		await expect(history.getList(noteId)).resolves.toHaveLength(0);
	});

	test('delete specific versions for note', async () => {
		const db = await dbPromise;
		const registry = new NotesController(db, FAKE_WORKSPACE_ID);
		const history = new NoteVersions(db, FAKE_WORKSPACE_ID);

		// Fetch any note
		const notes = await registry.get();
		const noteId = notes[1].id;

		// No versions for note
		await expect(history.getList(noteId)).resolves.toHaveLength(0);

		// Make snapshots
		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });

		// Versions now exists
		const versions1 = await history.getList(noteId);
		expect(versions1).toHaveLength(3);

		// Specific versions is exists
		const versionX = versions1[0];
		const versionY = versions1[1];
		expect(versions1).toContainEqual(versionX);
		expect(versions1).toContainEqual(versionY);

		// Deleted version must not to be in list
		await history.delete([versionY.id]);

		const versions2 = await history.getList(noteId);
		expect(versions2).toHaveLength(2);
		expect(versions2).toContainEqual(versionX);
		expect(versions2).not.toContainEqual(versionY);

		// Another deleted version must not to be in list too
		await history.delete([versionX.id]);

		const versions3 = await history.getList(noteId);
		expect(versions3).toHaveLength(1);
		expect(versions3).not.toContainEqual(versionX);
		expect(versions3).not.toContainEqual(versionY);
	});
});
