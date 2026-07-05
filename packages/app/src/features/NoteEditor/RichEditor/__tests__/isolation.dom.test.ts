import { screen, within } from '@testing-library/react';

import { renderRichEditor } from './utils/renderRichEditor';
import { textFormatClasses } from './utils/richEditorFixtures';
import { selectContent } from './utils/utils';

test('Formatting text in one editor does not affect the other editor', async () => {
	const editorA = await renderRichEditor({ value: 'Big text' });
	const editorB = await renderRichEditor({ value: 'Small text' });

	const editorContainers = screen.getAllByRole('textbox');
	expect(editorContainers).toHaveLength(2);

	// initial state
	expect(editorContainers[0]).toHaveTextContent('Big text');
	expect(editorContainers[1]).toHaveTextContent('Small text');

	// apply italic in editorA
	selectContent(editorContainers[0], 'Big text');
	await editorA.format('italic');
	expect(within(editorContainers[0]).getByRole('emphasis')).toHaveTextContent(
		'Big text',
	);
	expect(within(editorContainers[1]).queryByRole('emphasis')).not.toBeInTheDocument();

	// apply strikethrough in editorB
	selectContent(editorContainers[1], 'Small text');
	await editorB.format('strikethrough');
	expect(within(editorContainers[1]).getByText('Small text')).toHaveClass(
		textFormatClasses.strikethrough,
	);
	expect(within(editorContainers[1]).getByText('Small text')).not.toHaveClass(
		textFormatClasses.italic,
	);

	// No changes in editorA
	expect(within(editorContainers[0]).getByText('Big text')).toHaveClass(
		textFormatClasses.italic,
	);
	expect(within(editorContainers[0]).getByText('Big text')).not.toHaveClass(
		textFormatClasses.strikethrough,
	);
});
