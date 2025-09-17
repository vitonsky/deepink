import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export const ReadOnlyPlugin = ({ readonly }: { readonly: boolean }) => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		editor.setEditable(!readonly);

		// Observe state changes
		return editor.registerEditableListener((isEditable) => {
			// In case the mode is not readonly,
			// we should not change state
			if (!readonly) return;

			// Fix state
			if (isEditable) {
				editor.setEditable(false);
			}
		});
	}, [editor, readonly]);

	return null;
};
