import { useEffect } from 'react';
import {
	$createTextNode,
	$getSelection,
	$isTextNode,
	COMMAND_PRIORITY_NORMAL,
	IS_BOLD,
	IS_ITALIC,
	IS_STRIKETHROUGH,
	KEY_SPACE_COMMAND,
	TextFormatType,
	TextNode,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';

import {
	$createFormattingNode,
	$isFormattingNode,
	FormattingNode,
} from '../nodes/FormattingNode';

export const $convertTextNodeFormatting = (node: TextNode) => {
	const format = node.getFormat();
	if (format === 0) return;

	// 'bold' | 'underline' | 'strikethrough' | 'italic' | 'highlight' | 'code' | 'subscript' | 'superscript'

	const formatsMap = {
		bold: {
			tag: 'b',
			code: IS_BOLD,
		},
		italic: {
			tag: 'em',
			code: IS_ITALIC,
		},
		strikethrough: {
			tag: 'del',
			code: IS_STRIKETHROUGH,
		},
	} as const;

	for (const [format, meta] of Object.entries(formatsMap)) {
		if (!node.hasFormat(format as TextFormatType)) continue;

		const parentNode = $findMatchingParent(node, (node) => {
			if (!(node instanceof FormattingNode)) return false;

			return node.getTagName().toLowerCase() === meta.tag.toLowerCase();
		});
		if (parentNode) continue;

		console.log('TEXT CHANGE', format, meta);

		node.toggleFormat(format as TextFormatType);

		const newNode = $createFormattingNode({ tag: meta.tag });
		node.replace(newNode);
		newNode.append(node);
		node.select();
	}
};

export const $removeEmptyFormattingNode = (node: FormattingNode) => {
	const textContent = node.getTextContent();
	if (textContent.length > 0) return;

	node.remove();
};

export const FormattingPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			mergeRegister(
				editor.registerNodeTransform(TextNode, $convertTextNodeFormatting),
				editor.registerNodeTransform(FormattingNode, $removeEmptyFormattingNode),
				editor.registerCommand(
					KEY_SPACE_COMMAND,
					(event) => {
						if (!event.shiftKey) return false;

						let hasChanged = false;

						editor.update(() => {
							const selection = $getSelection();
							if (!selection) return;

							const points = selection.getStartEndPoints();
							if (!points) return;

							const [start, end] = points;

							if (
								start.getNode() !== end.getNode() ||
								start.offset !== end.offset
							)
								return;

							const focusedNode = end.getNode();
							if (!$isTextNode(focusedNode)) return;

							const parent = focusedNode.getParent();
							if (
								!parent ||
								!$isFormattingNode(parent) ||
								parent.getLastChild() !== focusedNode
							)
								return;

							if (end.offset != focusedNode.getTextContentSize()) return;

							const textNode = $createTextNode(' ');
							parent.insertAfter(textNode);
							textNode.select();

							event.stopImmediatePropagation();
							event.stopPropagation();
							event.preventDefault();

							hasChanged = true;
						});

						return hasChanged;
					},
					COMMAND_PRIORITY_NORMAL,
				),
			),
		[editor],
	);

	return null;
};
