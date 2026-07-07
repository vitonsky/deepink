import { page, userEvent } from 'vitest/browser';
import { renderRichEditorInDOM } from '@features/NoteEditor/RichEditor/__tests__/utils/renderEditorInDOM';

import { $convertToMarkdownString } from '../markdownParser';

vi.mock('electron', () => () => {});

test('Few paragraphs with empty lines', async () => {
	const { getEditor } = await renderRichEditorInDOM({ value: '' });

	const textbox = page.getByRole('textbox');
	const paragraph = page.getByRole('paragraph');

	await expect.element(textbox).toBeVisible();
	await expect.element(paragraph.first()).not.toBeInTheDocument();

	await userEvent.click(textbox);
	await userEvent.keyboard('Hello');
	await expect.poll(() => paragraph.all()).toHaveLength(1);

	await userEvent.keyboard('{Enter}World');
	await expect.poll(() => paragraph.all()).toHaveLength(2);

	expect(getEditor()!.read(() => $convertToMarkdownString())).toMatchSnapshot();
});
