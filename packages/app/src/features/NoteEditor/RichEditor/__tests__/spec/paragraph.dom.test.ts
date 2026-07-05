import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from '../utils/renderRichEditor';
import { setCursorPosition } from '../utils/utils';

test('Pressing Enter inside a paragraph splits it into two paragraphs', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: 'My favorite dish is cake' });

	// Initial state
	const editor = screen.getByRole('textbox');
	expect(editor.children).toHaveLength(1);
	const paragraph = editor.children[0];
	expect(paragraph).toHaveRole('paragraph');
	expect(paragraph).toHaveTextContent('My favorite dish is cake');

	// Place cursor and press Enter
	await user.click(paragraph);
	setCursorPosition(paragraph, 'My favorite dis'.length);
	await user.keyboard('{Enter}');

	// Editor should now have two paragraphs split at the cursor
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(2);

	expect(editorChildren[0]).toHaveRole('paragraph');
	expect(editorChildren[0]).toHaveTextContent('My favorite dis');

	expect(editorChildren[1]).toHaveRole('paragraph');
	expect(editorChildren[1]).toHaveTextContent('h is cake');
});

test('Ctrl+Enter exits a block node and creates a new empty paragraph', async () => {
	const user = userEvent.setup();
	const content = 'This is a blockquote';
	const richEditor = await renderRichEditor({ value: `> ${content}` });

	// One blockquote with one paragraph inside
	const editor = screen.getByRole('textbox');
	const initialChildren = editor.children;
	expect(initialChildren).toHaveLength(1);
	expect(initialChildren[0]).toHaveRole('blockquote');
	expect(initialChildren[0]).toHaveTextContent(content);

	expect(within(editor).getAllByRole('paragraph')).toHaveLength(1);

	// Press Ctrl+Enter to exit the blockquote
	await user.click(within(editor).getByRole('blockquote'));
	await user.keyboard('{Control>}{Enter}{/Control}');

	// New empty paragraph is added
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(2);
	expect(editorChildren[0]).toHaveRole('blockquote');
	expect(editorChildren[1]).toHaveRole('paragraph');

	const paragraphs = within(editor).getAllByRole('paragraph');
	expect(paragraphs).toHaveLength(2);
	expect(paragraphs[0]).toHaveTextContent(content);
	expect(paragraphs[1]).toHaveTextContent('');

	// Cursor lands in the new paragraph - inserted content inside new paragraph
	await richEditor.insert({ type: 'date', data: { date: '01.01.2025' } });
	expect(within(editor).getByText('01.01.2025')).toBeInTheDocument();
	expect(within(editor).getByRole('blockquote')).not.toHaveTextContent('01.01.2025');
});
