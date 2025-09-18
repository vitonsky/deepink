import React, { useEffect, useRef } from 'react';
import { $setSelection } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
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

		editor.update(() => {
			$convertFromMarkdownString(value);
			$setSelection(null);
		});

		// Disable editable mode while update if editor is not active,
		// to prevent forced focus on editor
		let isEditableForceDisabled = false;
		const isActiveBeforeUpdate = isFocusedElement(editor.getRootElement());
		if (!isActiveBeforeUpdate && editor.isEditable()) {
			editor.setEditable(false);
			isEditableForceDisabled = true;
		}

		// Listen `isEditable` changes once
		let isEditableChanged = false;
		const onEditableListenerCleanup = editor.registerEditableListener(() => {
			isEditableChanged = true;
			onEditableListenerCleanup();
		});

		editor.update(
			() => {
				$convertFromMarkdownString(value);
				$setSelection(null);
			},
			{
				onUpdate() {
					onEditableListenerCleanup();

					// Restore editable state once update completed
					// In case `isEditable` has changed outside, we should not touch this property anymore, since control on value is transferred.
					//
					if (isEditableForceDisabled && !isEditableChanged) {
						editor.setEditable(true);
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

	const syncValue = useDebouncedCallback(
		() => {
			editor.read(() => {
				onChange($convertToMarkdownString());
			});
		},
		{ wait: 500 },
	);

	return (
		<OnChangePlugin
			ignoreSelectionChange
			onChange={(_, editor) => {
				const isActive = isFocusedElement(editor.getRootElement());
				if (!isActive) return;

				syncValue();
			}}
		/>
	);
};
