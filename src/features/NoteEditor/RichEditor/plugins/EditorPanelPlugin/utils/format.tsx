import { $isBlockElementNode, LexicalNode } from 'lexical';

import { TextFormat } from '../../../../EditorPanel';
import { $insertAfter } from '../../../utils/selection';
import {
	$createFormattingNode,
	$isFormattingNode,
	FormattingNode,
} from '../../Markdown/nodes/FormattingNode';

export const $getFormatNodes = (node: LexicalNode): FormattingNode[] => {
	return node.getParents().filter((node) => $isFormattingNode(node));
};

const formatMap = {
	bold: 'b',
	italic: 'em',
	strikethrough: 'del',
} satisfies Record<TextFormat, string>;

export const $getFormatNode = (node: LexicalNode, format: TextFormat) => {
	const isMatch = (formatNode: FormattingNode) =>
		formatNode.getTagName() === formatMap[format];

	if ($isFormattingNode(node) && isMatch(node)) {
		return node;
	}

	return $getFormatNodes(node).find(isMatch) ?? null;
};

export const $setFormatNode = (node: LexicalNode, format: TextFormat) => {
	const parentFormat = $getFormatNode(node, format);
	if (parentFormat) return;

	const formattingNode = $createFormattingNode({ tag: formatMap[format] });
	if ($isBlockElementNode(node)) {
		formattingNode.append(...node.getChildren());
		node.append(formattingNode);
		return formattingNode;
	}

	node.replace(formattingNode);
	formattingNode.append(node);
	return formattingNode;
};

export const $removeFormatNode = (node: LexicalNode, format: TextFormat) => {
	const parentFormat = $getFormatNode(node, format);
	if (!parentFormat) return;

	$insertAfter(parentFormat, parentFormat.getChildren());
};

export const $toggleFormatNode = (node: LexicalNode, format: TextFormat) => {
	const parentFormat = $getFormatNode(node, format);

	if (!parentFormat) {
		$setFormatNode(node, format);
	} else {
		$removeFormatNode(node, format);
	}
};
