import { useEffect, useRef } from 'react';
import { $setSelection } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useDebouncedCallback } from '@utils/debounce/useDebouncedCallback';

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

		// Cleanup for new values, since it will be updated
		// Otherwise we may have bug when value is updated via `editor.update`, an `OnChangePlugin` will not trigger callback (because synthetic update) and if next value update will have previous value - update will be ignored.
		serializedValueRef.current = null;

		editor.update(
			() => {
				$convertFromMarkdownString(value);
				$setSelection(null);
			},
			{ tag: 'external-update' },
		);
	}, [editor, value]);

	const onChange = (value: string) => {
		serializedValueRef.current = value;

		if (onChanged) {
			onChanged(value);
		}
	};

	const syncValue = useDebouncedCallback(
		() => {
			editor.read(() => {
				onChange($convertToMarkdownString());
			});
		},
		{ wait: 500 },
	);

	useEffect(() => {
		return editor.registerUpdateListener(({ tags, dirtyElements, dirtyLeaves }) => {
			// Ignore non-user-initiated updates
			if (tags.has('external-update')) return;

			// Update only if there are actual changes
			if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

			const isActive = isFocusedElement(editor.getRootElement());
			if (!isActive) return;

			syncValue();
		});
	}, [editor, syncValue]);
	return null;
};
