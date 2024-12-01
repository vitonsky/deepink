import React, { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';

import { $convertFromMarkdownString, $convertToMarkdownString } from './markdownParser';

export const isFocusedElement = (element: HTMLElement | null) => {
	if (!element || !document.activeElement) return false;

	if (element !== document.activeElement && !element.contains(document.activeElement))
		return false;

	return true;
};

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

		const isEditable = editor.isEditable();

		// Disable editable mode while update if editor is not active,
		// to prevent forced focus on editor
		const isActiveBeforeUpdate = isFocusedElement(editor.getRootElement());
		if (!isActiveBeforeUpdate && isEditable) {
			editor.setEditable(false);
		}

		editor.update(
			() => {
				$convertFromMarkdownString(value);
			},
			{
				onUpdate() {
					// Restore editable state once update completed
					if (isEditable !== editor.isEditable()) {
						editor.setEditable(isEditable);
					}
				},
			},
		);
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
