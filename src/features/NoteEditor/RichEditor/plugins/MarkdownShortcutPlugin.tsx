import React, { useEffect } from 'react';
import { $createTextNode, $isParagraphNode, ParagraphNode, TextNode } from 'lexical';
import {
	$createListItemNode,
	$createListNode,
	ListItemNode,
	ListNode,
} from '@lexical/list';
import { CHECK_LIST, LINK, TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { MarkdownShortcutPlugin as ExternalMarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { mergeRegister } from '@lexical/utils';

const customTransformers = [LINK, CHECK_LIST, ...TRANSFORMERS];

// TODO: fix bug with multiple checkbox items
// TODO: add tests for case `- [ ] hello` and `- `[ ]` hello`
export const $transformTextToCheckbox = (textNode: TextNode) => {
	// Skip text node that have any format
	if (!textNode.isSimpleText()) return;

	// Checkbox signature in list item
	const checkboxSegmentInsideListMatch = textNode
		.getTextContent()
		.match(/^\[(x|\s)\]\s*/i);
	if (checkboxSegmentInsideListMatch) {
		const listItemNode = textNode.getParent();

		// Skip if text not placed in list item
		if (!(listItemNode instanceof ListItemNode)) return;

		// Skip if item is already are checkbox
		if (listItemNode.getChecked() !== undefined) return;

		const listNode = listItemNode.getParent();

		// Skip if can't find list in ancestors
		if (!(listNode instanceof ListNode)) return;

		// Replace list to check list
		// We replace, instead of set type, since with this way item can't be checked
		if (listNode.getListType() !== 'check') {
			const list = $createListNode('check');
			listNode.replace(list, true);
		}

		const isChecked = checkboxSegmentInsideListMatch[1] != ' ';
		listItemNode.setChecked(isChecked);

		const slice = textNode
			.getTextContent()
			.slice(checkboxSegmentInsideListMatch[0].length);
		textNode.setTextContent(slice);
	}

	// Checkbox at any place in text
	const checkboxMatch = textNode.getTextContent().match(/^([\*\-])\s\[(x|\s)\]\s*/i);
	if (checkboxMatch) {
		const parent = textNode.getParent();
		if (!parent) return;

		// Skip if parent already is list item
		// if (parent instanceof ListItemNode) return;
		if (!(parent instanceof ParagraphNode)) return;

		const isChecked = checkboxMatch[2] != ' ';
		const listItemNode = $createListItemNode(isChecked);

		const slice = textNode.getTextContent().slice(checkboxMatch[0].length);
		listItemNode.append($createTextNode(slice));

		const list = $createListNode('check');
		list.append(listItemNode);
		parent.replace(list);

		listItemNode.select();
	}
};

export const $transformTextToHorizontalRule = (node: TextNode) => {
	if (!/^(\*|\-|\_){3,}$/.test(node.getTextContent())) return;

	const parent = node.getParent();
	if (!$isParagraphNode(parent)) return;

	if (parent.getChildrenSize() !== 1) return;

	parent.replace($createHorizontalRuleNode()).selectEnd();
};

export const MarkdownShortcutPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			mergeRegister(
				editor.registerNodeTransform(TextNode, $transformTextToCheckbox),
				editor.registerNodeTransform(TextNode, $transformTextToHorizontalRule),
			),
		[editor],
	);

	return <ExternalMarkdownShortcutPlugin transformers={customTransformers} />;
};
