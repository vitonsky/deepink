import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from '../utils/renderRichEditor';

test('Editor is not editable in readonly mode', async () => {
	const user = userEvent.setup();
	await renderRichEditor({
		value: '# Hello',
		isReadOnly: true,
	});

	expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false');

	// Cannot enter text
	await user.click(screen.getByRole('heading'));
	await user.keyboard('Some text');

	expect(screen.getByRole('textbox')).toHaveTextContent('Hello');
	expect(screen.getByRole('textbox')).not.toHaveTextContent('Some text');
});

test('ReadOnly editor is not editable while the other editor remains editable', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: 'Editable text' });
	await renderRichEditor({ value: 'ReadOnly text', isReadOnly: true });

	const textBoxes = screen.getAllByRole('textbox');
	expect(textBoxes).toHaveLength(2);

	expect(textBoxes[0]).toHaveAttribute('contenteditable', 'true');
	expect(textBoxes[1]).toHaveAttribute('contenteditable', 'false');

	// editorA is editable — editing works
	await user.click(within(textBoxes[0]).getByText('Editable text'));
	await user.keyboard('New text ');

	expect(textBoxes[0]).toHaveTextContent('New text Editable text');

	// editorB is readOnly — editing must be ignored
	await user.click(within(textBoxes[1]).getByText('ReadOnly text'));
	await user.keyboard('Some text');

	expect(textBoxes[1]).toHaveTextContent('ReadOnly text');
	expect(textBoxes[1]).not.toHaveTextContent('Some text');
	expect(textBoxes[1]).toHaveAttribute('contenteditable', 'false');
});
