import { NoteExportData } from '@core/storage/interop/export';

import { configureNoteNameGetter } from './useNotesExport';

test('Many notes mode', () => {
	const getName = configureNoteNameGetter();

	expect(
		getName({
			id: 'id1',
			content: { title: 'foo' },
			tags: [],
		} as unknown as NoteExportData),
	).toBe('/foo.md');
	expect(
		getName({
			id: 'id2',
			content: { title: '' },
			tags: [],
		} as unknown as NoteExportData),
	).toBe('/id2.md');
	expect(
		getName({
			id: 'id3',
			content: { title: 'foo' },
			tags: [],
		} as unknown as NoteExportData),
	).toBe('/foo-1.md');
	expect(
		getName({
			id: 'id4',
			content: { title: 'foo' },
			tags: ['foo', 'bar', 'x/y', 'baz'],
		} as unknown as NoteExportData),
	).toBe('/x/y/foo.md');
	expect(
		getName({
			id: 'id5',
			content: { title: '/x/y/z#?$%' },
			tags: [],
		} as unknown as NoteExportData),
	).toBe('/x_y_z_.md');
	expect(
		getName({
			id: 'id5',
			content: { title: '/x/y/z' },
			tags: ['foo/bar/baz'],
		} as unknown as NoteExportData),
	).toBe('/foo/bar/baz/x_y_z.md');
});

test('Single note mode', () => {
	const getName = configureNoteNameGetter(true);

	expect(
		getName({
			id: 'id1',
			content: { title: 'foo' },
			tags: [],
		} as unknown as NoteExportData),
	).toBe('/foo.md');
	expect(
		getName({
			id: 'id2',
			content: { title: '' },
			tags: [],
		} as unknown as NoteExportData),
	).toBe('/id2.md');
	expect(
		getName({
			id: 'id3',
			content: { title: 'foo' },
			tags: [],
		} as unknown as NoteExportData),
	).toBe('/foo-1.md');
	expect(
		getName({
			id: 'id4',
			content: { title: 'foo' },
			tags: ['foo', 'bar', 'x/y', 'baz'],
		} as unknown as NoteExportData),
	).toBe('/foo-2.md');
});
