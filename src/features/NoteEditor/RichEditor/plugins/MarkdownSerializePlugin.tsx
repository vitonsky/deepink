import React, { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';

import { $convertFromMarkdownString, $convertToMarkdownString } from './markdownParser';

export type MarkdownSerializePluginProps = {
	value: string;
	onChanged?: (value: string) => void;
};

export const MarkdownSerializePlugin = ({
	value,
	onChanged,
}: MarkdownSerializePluginProps) => {
	const [editor] = useLexicalComposerContext();

	const serializedValueRef = useRef<string | null>(null);
	useEffect(() => {
		// Skip updates sent from this component, based on value equality
		if (serializedValueRef.current === value) return;

		editor.update(() => {
			$convertFromMarkdownString(value);
		});
	}, [editor, value]);

	const onChange = (value: string) => {
		serializedValueRef.current = value;

		if (onChanged) {
			onChanged(value);
		}
	};

	return (
		<OnChangePlugin
			onChange={(_, editor) => {
				if (!editor.isEditable()) return;

				// TODO: debounce for 1-3 seconds
				editor.read(() => {
					onChange($convertToMarkdownString());
				});
			}}
		/>
	);
};
