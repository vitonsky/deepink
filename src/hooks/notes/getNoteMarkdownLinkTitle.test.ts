import { getNoteMarkdownLinkTitle } from './getNoteMarkdownLinkTitle';

test('uses title if provided, defaults to text when title is empty', () => {
	const title = 'About cat';
	const text = 'The cat, also called domestic cat';

	expect(getNoteMarkdownLinkTitle({ title, text })).toBe(title);
	expect(getNoteMarkdownLinkTitle({ title: '', text })).toBe(text);
});

test('truncates text longer than maxLength', () => {
	const longText =
		'The cat, also called domestic cat and house cat, is a small carnivorous mammal.';
	const maxLength = 30;

	expect(
		getNoteMarkdownLinkTitle({ title: longText, text: '' }, maxLength).length,
	).toBeLessThanOrEqual(maxLength);

	expect(
		getNoteMarkdownLinkTitle({ title: '', text: longText }, maxLength).length,
	).toBeLessThanOrEqual(maxLength);
});

test('escapes Markdown special characters', () => {
	expect(getNoteMarkdownLinkTitle({ title: '[Note](note://123)', text: '' })).toBe(
		'\\[Note\\](note://123)',
	);
});

test('returns "Untitled" when both title and text are empty', () => {
	expect(getNoteMarkdownLinkTitle({ title: '', text: '' })).toBe('Untitled');
	expect(getNoteMarkdownLinkTitle({ title: '    ', text: '' })).toBe('Untitled');
	expect(getNoteMarkdownLinkTitle({ title: '', text: '   ' })).toBe('Untitled');
});
