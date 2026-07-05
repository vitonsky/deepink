import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from '../utils/renderRichEditor';
import { textFormatClasses } from '../utils/richEditorFixtures';
import { selectContent, selectText } from '../utils/utils';

test('Text formatting can be toggled', async () => {
	const content = 'Hello, my dear friends!';
	const richEditor = await renderRichEditor({ value: content });

	const editor = screen.getByRole('textbox');

	// Apply strikethrough
	selectContent(editor, content);
	await richEditor.format('strikethrough');
	expect(within(editor).getByText(content)).toHaveClass(
		textFormatClasses.strikethrough,
	);

	// Remove strikethrough
	selectContent(editor, content);
	await richEditor.format('strikethrough');
	expect(within(editor).getByText(content)).not.toHaveClass(
		textFormatClasses.strikethrough,
	);

	// Apply italic
	selectContent(editor, content);
	await richEditor.format('italic');
	expect(within(editor).getByText(content)).toHaveClass(textFormatClasses.italic);

	// Remove italic
	selectContent(editor, content);
	await richEditor.format('italic');
	expect(within(editor).getByText(content)).not.toHaveClass(textFormatClasses.italic);
});

test('One text node can have different formatting at once', async () => {
	const content = 'Hello, my dear friends!';
	const richEditor = await renderRichEditor({ value: content });

	const editor = screen.getByRole('textbox');

	selectContent(editor, content);
	await richEditor.format('italic');
	await richEditor.format('bold');
	await richEditor.format('strikethrough');

	expect(within(editor).getByText(content)).toHaveClass(textFormatClasses.bold);
	expect(within(editor).getByText(content)).toHaveClass(textFormatClasses.italic);
	expect(within(editor).getByText(content)).toHaveClass(
		textFormatClasses.strikethrough,
	);

	// Removes bold without breaking others formatting
	selectContent(editor, content);
	await richEditor.format('bold');

	expect(within(editor).getByText(content)).not.toHaveClass(textFormatClasses.bold);
	expect(within(editor).getByText(content)).toHaveClass(textFormatClasses.italic);
	expect(within(editor).getByText(content)).toHaveClass(
		textFormatClasses.strikethrough,
	);
});

test('Formatting can be applied to a part of text', async () => {
	const user = userEvent.setup();
	const richEditor = await renderRichEditor({ value: 'Hello, my dear friends!' });

	const editor = screen.getByRole('textbox');
	await user.click(editor);

	// Apply formatting
	selectText(editor, 'friends');
	await richEditor.format('italic');

	expect(within(editor).getByText('friends')).toHaveClass(textFormatClasses.italic);
});

describe('Formatting via keyboard shortcuts', () => {
	const cases: {
		title: string;
		shortcut: string;
		formatClass: RegExp;
	}[] = [
		{
			title: 'Ctrl+I must toggle Italic format',
			shortcut: '{Control>}i{/Control}',
			formatClass: textFormatClasses.italic,
		},
		{
			title: 'Ctrl+B must toggle Bold format',
			shortcut: '{Control>}b{/Control}',
			formatClass: textFormatClasses.bold,
		},
	];

	cases.forEach(({ title, shortcut, formatClass }) =>
		test(title, async () => {
			const user = userEvent.setup();
			await renderRichEditor({
				value: 'The quick brown fox jumps over the lazy dog',
			});

			const editor = screen.getByRole('textbox');
			await user.click(editor);

			const selectionText = 'quick brown fox';

			// Apply formatting
			selectText(editor, selectionText);
			await user.keyboard(shortcut);
			expect(within(editor).getByText(selectionText)).toHaveClass(formatClass);

			// Remove formatting
			selectText(editor, selectionText);
			await user.keyboard(shortcut);
			expect(
				within(editor).getByText(selectionText, { exact: false }),
			).not.toHaveClass(formatClass);
		}),
	);
});
