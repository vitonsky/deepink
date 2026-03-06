import { getUUID } from 'src/__tests__/utils/uuid';

import { getNoteFileName } from './getNoteFileName';

const fakeNoteId = getUUID();

test('returns title', () => {
	expect(getNoteFileName(fakeNoteId, 'My Note')).toBe('My Note');

	// trimmed title
	expect(getNoteFileName(fakeNoteId, '   My Note   ')).toBe('My Note');
});

test('truncates title longer than 50 chars', () => {
	const title = 'Communication is commonly defined as the transmission of information';
	expect(getNoteFileName(fakeNoteId, title)).toHaveLength(50);
});

test('defaults to note id when title is empty', () => {
	expect(getNoteFileName(fakeNoteId, '')).toBe(`note_${fakeNoteId}`);

	// title is is only whitespace
	expect(getNoteFileName(fakeNoteId, '   ')).toBe(`note_${fakeNoteId}`);
});
