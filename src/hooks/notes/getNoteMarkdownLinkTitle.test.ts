import { getNoteMarkdownLinkTitle } from './getNoteMarkdownLinkTitle';

test('uses the title if provided, defaults to text when title is empty', () => {
	const title = 'About cat';
	const text = 'The cat, also called domestic cat';

	expect(getNoteMarkdownLinkTitle({ title, text })).toBe(title);
	expect(getNoteMarkdownLinkTitle({ title, text: '' })).toBe(title);

	expect(getNoteMarkdownLinkTitle({ title: '', text })).toBe(text);
	expect(getNoteMarkdownLinkTitle({ title: '   ', text })).toBe(text);
});

test('truncates text longer than 50 characters', () => {
	const longText =
		'The cat, also called domestic cat and house cat, is a small carnivorous mammal.';

	expect(getNoteMarkdownLinkTitle({ title: longText, text: '' })).toHaveLength(50);
	expect(getNoteMarkdownLinkTitle({ title: '', text: longText })).toHaveLength(50);
});

test('escapes Markdown link special characters', () => {
	const noteLink = '[Note](note://123)';
	const escapedNoteLink = '\\[Note\\](note://123)';

	expect(getNoteMarkdownLinkTitle({ title: noteLink, text: '' })).toBe(escapedNoteLink);
	expect(getNoteMarkdownLinkTitle({ title: '', text: noteLink })).toBe(escapedNoteLink);

	const externalLink = '[w](https://www.wikipedia.org/)';
	const escapedExternalLink = '\\[w\\](https://www.wikipedia.org/)';

	expect(getNoteMarkdownLinkTitle({ title: externalLink, text: '' })).toBe(
		escapedExternalLink,
	);
	expect(getNoteMarkdownLinkTitle({ title: '', text: externalLink })).toBe(
		escapedExternalLink,
	);
});

test('returns the date as default when both title and text are empty', () => {
	const date = new Date('2026-03-08').toDateString(); // Sun Mar 08 2026
	const timestamp = new Date('2026-03-08').getTime();

	expect(getNoteMarkdownLinkTitle({ title: '', text: '' }, timestamp)).toBe(date);
	expect(getNoteMarkdownLinkTitle({ title: '   ', text: '' }, timestamp)).toBe(date);
	expect(getNoteMarkdownLinkTitle({ title: '', text: '   ' }, timestamp)).toBe(date);
});
