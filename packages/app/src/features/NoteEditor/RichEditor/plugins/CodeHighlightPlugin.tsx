import { useEffect } from 'react';
import { registerCodeIndentation } from '@lexical/code-core';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export const CodeHighlightPlugin = () => {
	const [editor] = useLexicalComposerContext();

	// TODO: use registerCodeHighlighting
	useEffect(() => {
		return registerCodeIndentation(editor);
	}, [editor]);

	return null;
};
