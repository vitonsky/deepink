import { useEffect } from 'react';
import { IS_BOLD, IS_ITALIC, IS_STRIKETHROUGH, TextFormatType, TextNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';

import { $createFormattingNode, FormattingNode } from '../nodes/FormattingNode';

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
	}
};

export const FormattingPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			mergeRegister(
				editor.registerNodeTransform(TextNode, $convertTextNodeFormatting),
			),
		[editor],
	);

	return null;
};
