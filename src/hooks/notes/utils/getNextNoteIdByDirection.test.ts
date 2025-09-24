import { getNextNoteIdByDirection } from './getNextNoteIdByDirection';

test('Returns next note id', () => {
	const openedNotes = [
		{ id: 'note1', content: { text: 'Hello', title: 'Note 1' } },
		{ id: 'note2', content: { text: 'Hello', title: 'Note 2' } },
		{ id: 'note3', content: { text: 'Hello', title: 'Note 3' } },
		{ id: 'note4', content: { text: 'Hello', title: 'Note 4' } },
		{ id: 'note5', content: { text: 'Hello', title: 'Note 5' } },
	];

	expect(getNextNoteIdByDirection(openedNotes, openedNotes[0].id, 1)).toBe(
		openedNotes[1].id,
	);
});

test('Returns previously note id', () => {
	const openedNotes = [
		{ id: 'note1', content: { text: 'Hello', title: 'Note 1' } },
		{ id: 'note2', content: { text: 'Hello', title: 'Note 2' } },
		{ id: 'note3', content: { text: 'Hello', title: 'Note 3' } },
		{ id: 'note4', content: { text: 'Hello', title: 'Note 4' } },
		{ id: 'note5', content: { text: 'Hello', title: 'Note 5' } },
	];

	expect(getNextNoteIdByDirection(openedNotes, openedNotes[1].id, -1)).toBe(
		openedNotes[0].id,
	);
});

test('Return the last note if the active note is the first in the array and the offset is negative', () => {
	const openedNotes = [
		{ id: 'note1', content: { text: 'Hello', title: 'Note 1' } },
		{ id: 'note2', content: { text: 'Hello', title: 'Note 2' } },
		{ id: 'note3', content: { text: 'Hello', title: 'Note 3' } },
		{ id: 'note4', content: { text: 'Hello', title: 'Note 4' } },
		{ id: 'note5', content: { text: 'Hello', title: 'Note 5' } },
	];
	const lastNoteId = openedNotes[openedNotes.length - 1].id;

	expect(getNextNoteIdByDirection(openedNotes, openedNotes[0].id, -1)).toBe(lastNoteId);
});

test('Return the first note if the active note is the last in the array and the offset is positive', () => {
	const openedNotes = [
		{ id: 'note1', content: { text: 'Hello', title: 'Note 1' } },
		{ id: 'note2', content: { text: 'Hello', title: 'Note 2' } },
		{ id: 'note3', content: { text: 'Hello', title: 'Note 3' } },
		{ id: 'note4', content: { text: 'Hello', title: 'Note 4' } },
		{ id: 'note5', content: { text: 'Hello', title: 'Note 5' } },
	];
	const firstNoteId = openedNotes[0].id;

	expect(
		getNextNoteIdByDirection(openedNotes, openedNotes[openedNotes.length - 1].id, 1),
	).toBe(firstNoteId);
});
