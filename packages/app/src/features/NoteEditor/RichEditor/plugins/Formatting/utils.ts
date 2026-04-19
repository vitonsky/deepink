import { IS_BOLD, IS_ITALIC, IS_STRIKETHROUGH, TextFormatType, TextNode } from 'lexical';
import { $findMatchingParent } from '@lexical/utils';

import { $createFormattingNode, FormattingNode } from '../Markdown/nodes/FormattingNode';

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

export const $convertTextNodeFormatting = (node: TextNode) => {
	const format = node.getFormat();
	if (format === 0) return;

	for (const [format, meta] of Object.entries(formatsMap)) {
		if (!node.hasFormat(format as TextFormatType)) continue;

		// Looking for parent format node with current format
		const parentFormatNode = $findMatchingParent(node, (node) => {
			if (!(node instanceof FormattingNode)) return false;

			return node.getTagName().toLowerCase() === meta.tag.toLowerCase();
		});
		if (parentFormatNode) continue;

		// Remove format
		node.toggleFormat(format as TextFormatType);

		// Wrap to formatting node
		const newNode = $createFormattingNode({ tag: meta.tag });
		node.replace(newNode);
		newNode.append(node);
		node.select();
	}
};
