import { getMarkdownTitle } from './getMarkdownLinkTitle';

test('uses title if provided, defaults to text when title is empty', () => {
	const title = 'About cat';
	const text = 'The cat, also called domestic cat';

	expect(getMarkdownTitle({ title, text })).toBe(title);
	expect(getMarkdownTitle({ title: '', text })).toBe(text);
});

test('truncates text longer than maxLength', () => {
	const longText =
		'The cat, also called domestic cat and house cat, is a small carnivorous mammal.';
	const maxLength = 30;

	expect(getMarkdownTitle({ title: longText, text: '' }, maxLength)).toHaveLength(
		maxLength,
	);
	expect(getMarkdownTitle({ title: '', text: longText }, maxLength)).toHaveLength(
		maxLength,
	);
});

test('escapes Markdown special characters', () => {
	expect(getMarkdownTitle({ title: '[Note](note://123)', text: '' })).toBe(
		'\\[Note\\](note://123)',
	);
});

test('returns "Untitled" when both title and text are empty', () => {
	expect(getMarkdownTitle({ title: '', text: '' })).toBe('Untitled');
});
