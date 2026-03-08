import { getNoteContentPreview } from './getNoteContentPreview';

test('uses the title if provided, defaults to text when title is empty', () => {
	const title = 'About cat';
	const text = 'The cat, also called domestic cat';

	expect(getNoteContentPreview({ title, text })).toBe(title);
	expect(getNoteContentPreview({ title, text: '' })).toBe(title);

	expect(getNoteContentPreview({ title: '', text })).toBe(text);
	expect(getNoteContentPreview({ title: '   ', text })).toBe(text);
});

test('truncates text longer than 50 characters', () => {
	const longText =
		'The cat, also called domestic cat and house cat, is a small carnivorous mammal.';

	expect(getNoteContentPreview({ title: longText, text: '' })).toHaveLength(50);
	expect(getNoteContentPreview({ title: '', text: longText })).toHaveLength(50);
});

test('escapes Markdown link special characters', () => {
	const noteLink = '[Note](note://123)';
	const escapedNoteLink = '\\[Note\\](note://123)';

	expect(getNoteContentPreview({ title: noteLink, text: '' })).toBe(escapedNoteLink);
	expect(getNoteContentPreview({ title: '', text: noteLink })).toBe(escapedNoteLink);

	const externalLink = '[w](https://www.wikipedia.org/)';
	const escapedExternalLink = '\\[w\\](https://www.wikipedia.org/)';

	expect(getNoteContentPreview({ title: externalLink, text: '' })).toBe(
		escapedExternalLink,
	);
	expect(getNoteContentPreview({ title: '', text: externalLink })).toBe(
		escapedExternalLink,
	);
});

test('returns null when both title and text are empty', () => {
	expect(getNoteContentPreview({ title: '', text: '' })).toBe(null);
	expect(getNoteContentPreview({ title: '   ', text: '' })).toBe(null);
	expect(getNoteContentPreview({ title: '', text: '   ' })).toBe(null);
});
