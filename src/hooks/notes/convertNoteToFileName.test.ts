import { getUUID } from 'src/__tests__/utils/uuid';

import { convertNoteToFileName } from './convertNoteToFileName';

const fakeNoteId = getUUID();

test('returns title', () => {
	expect(convertNoteToFileName(fakeNoteId, 'My Note')).toBe('My Note');

	// trimmed title
	expect(convertNoteToFileName(fakeNoteId, '   My Note   ')).toBe('My Note');
});

test('truncates title longer than 50 chars', () => {
	const title = 'Communication is commonly defined as the transmission of information';
	expect(convertNoteToFileName(fakeNoteId, title)).toHaveLength(50);
});

test('defaults to note id when title is empty', () => {
	expect(convertNoteToFileName(fakeNoteId, '')).toBe(`note_${fakeNoteId}`);

	// title is is only whitespace
	expect(convertNoteToFileName(fakeNoteId, '   ')).toBe(`note_${fakeNoteId}`);
});
