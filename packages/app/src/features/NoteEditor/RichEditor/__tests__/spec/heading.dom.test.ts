import { screen, within } from '@testing-library/react';

import { renderRichEditor } from '../utils/renderRichEditor';
import { selectContent } from '../utils/utils';

test('Updates heading level correctly', async () => {
	const content = 'Hello, my dear friends!';
	const richEditor = await renderRichEditor({ value: content });

	const editor = screen.getByRole('textbox');
	selectContent(editor, content);

	// Plain text becomes heading
	await richEditor.insert({ type: 'heading', data: { level: 1 } });
	expect(within(editor).getByRole('heading', { level: 1 })).toHaveTextContent(content);

	// Heading level is updated when different level applied
	await richEditor.insert({ type: 'heading', data: { level: 3 } });

	expect(within(editor).getByRole('heading', { level: 3 })).toHaveTextContent(content);
	expect(within(editor).queryByRole('heading', { level: 1 })).not.toBeInTheDocument();

	// Heading reverts to paragraph when same level applied again
	await richEditor.insert({ type: 'heading', data: { level: 3 } });

	expect(within(editor).queryByRole('heading')).not.toBeInTheDocument();
	expect(within(editor).getByText(content)).toBeInTheDocument();

	// After editing the screen should contain one paragraph with a text
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(1);
	expect(editorChildren[0]).toHaveRole('paragraph');
	expect(editorChildren[0]).toHaveTextContent(content);
});
