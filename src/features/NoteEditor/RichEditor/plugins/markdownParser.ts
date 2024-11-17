/* eslint-disable @typescript-eslint/no-use-before-define */
import {
	$createLineBreakNode,
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isLineBreakNode,
	$isParagraphNode,
	$isTextNode,
	IS_CODE,
	LexicalNode,
} from 'lexical';
import {
	Blockquote,
	Break,
	Code,
	Content,
	Delete,
	Emphasis,
	Heading,
	HTML,
	Image,
	InlineCode,
	Link,
	List,
	ListItem,
	Paragraph,
	Root,
	Strong,
	Table,
	TableCell,
	TableRow,
	Text,
	ThematicBreak,
} from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { u } from 'unist-builder';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import { $createLinkNode, $isLinkNode } from '@lexical/link';
import {
	$createListItemNode,
	$createListNode,
	$isListItemNode,
	$isListNode,
	ListType,
} from '@lexical/list';
import {
	$createHorizontalRuleNode,
	$isHorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import {
	$createHeadingNode,
	$createQuoteNode,
	$isHeadingNode,
	$isQuoteNode,
} from '@lexical/rich-text';
import {
	$createTableCellNode,
	$createTableNode,
	$createTableRowNode,
	$isTableCellNode,
	$isTableNode,
	$isTableRowNode,
	TableCellHeaderStates,
} from '@lexical/table';

import { $createFormattingNode, $isFormattingNode } from '../nodes/FormattingNode';
import { $createImageNode, $isImageNode } from '../nodes/ImageNode';
import { $createRawNode } from '../nodes/RawNode';

const markdownProcessor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkStringify, {
		bullet: '-',
		listItemIndent: 'one',
		join: [
			() => {
				return 0;
			},
		],
	})
	.freeze();

export const dumpMarkdownNode = (node: Content) => {
	const content = markdownProcessor.stringify(
		u('root', {
			children: [node],
		}) satisfies Root,
	);

	if (content.slice(-1) === '\n') {
		return content.slice(0, -1);
	}

	return content;
};

export const $convertFromMarkdownString = (rawMarkdown: string) => {
	const mdTree = markdownProcessor.parse(rawMarkdown);

	function convertToMarkdownNode(node: Content): LexicalNode {
		switch (node.type) {
			case 'text': {
				return $createTextNode(node.value);
			}
			case 'paragraph': {
				const paragraph = $createParagraphNode();
				paragraph.append(...convertToMarkdownNodes(node.children));

				return paragraph;
			}
			case 'image': {
				return $createImageNode({
					src: node.url,
					altText: node.alt || '',
				});
			}
			case 'heading': {
				const heading = $createHeadingNode(`h${node.depth}`);
				heading.append(...convertToMarkdownNodes(node.children));

				return heading;
			}
			case 'list': {
				let listType: ListType = 'bullet';
				if (
					node.children.some(
						(item) => item.checked !== undefined && item.checked !== null,
					)
				) {
					listType = 'check';
				} else if (node.ordered || typeof node.start === 'number') {
					listType = 'number';
				}

				const list = $createListNode(listType);
				list.append(...convertToMarkdownNodes(node.children));

				return list;
			}
			case 'listItem': {
				const listItem = $createListItemNode(node.checked ?? undefined);
				listItem.append(...convertToMarkdownNodes(node.children));

				return listItem;
			}
			case 'link': {
				const link = $createLinkNode(node.url, { title: node.title });
				link.append(...convertToMarkdownNodes(node.children));

				return link;
			}
			case 'blockquote': {
				const quote = $createQuoteNode();
				quote.append(...convertToMarkdownNodes(node.children));

				return quote;
			}
			case 'table': {
				const table = $createTableNode();
				table.append(...convertToMarkdownNodes(node.children, true));
				return table;
			}
			case 'tableRow': {
				const tableRow = $createTableRowNode();
				tableRow.append(...convertToMarkdownNodes(node.children, true));
				return tableRow;
			}
			case 'tableCell': {
				const tableCell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
				tableCell.append(...convertToMarkdownNodes(node.children, true));
				return tableCell;
			}
			case 'code': {
				const code = $createCodeNode(node.lang);
				code.append($createTextNode(node.value));

				return code;
			}
			case 'inlineCode': {
				const text = $createTextNode(node.value);
				text.setFormat(IS_CODE);
				return text;
			}
			case 'emphasis': {
				const format = $createFormattingNode({ tag: 'em' });
				format.append(...convertToMarkdownNodes(node.children));

				return format;
			}
			case 'strong': {
				const format = $createFormattingNode({ tag: 'b' });
				format.append(...convertToMarkdownNodes(node.children));

				return format;
			}
			case 'delete': {
				const format = $createFormattingNode({ tag: 'del' });
				format.append(...convertToMarkdownNodes(node.children));

				return format;
			}
			case 'break': {
				return $createLineBreakNode();
			}
			case 'thematicBreak': {
				const format = $createHorizontalRuleNode();
				return format;
			}
		}

		const rawNode = $createRawNode();
		rawNode.append($createTextNode(dumpMarkdownNode(node)));
		return rawNode;
	}

	function convertToMarkdownNodes(
		mdTree: Content[],
		strictMode = false,
	): LexicalNode[] {
		const lexicalTree: LexicalNode[] = [];

		let lastNode: Content | null = null;
		for (const mdNode of mdTree) {
			if (!strictMode) {
				// Insert line breaks
				if (
					lastNode !== null &&
					lastNode.position &&
					mdNode !== null &&
					mdNode.position
				) {
					const missedLines =
						mdNode.position.start.line - lastNode.position.end.line;

					for (let i = 0; i < missedLines - 1; i++) {
						lexicalTree.push($createParagraphNode());
					}
				}
			}

			lastNode = mdNode;
			lexicalTree.push(convertToMarkdownNode(mdNode));
		}

		return lexicalTree;
	}

	const lexicalNodes = convertToMarkdownNodes(mdTree.children).map((node) => {
		if (!$isTextNode(node)) return node;

		const paragraph = $createParagraphNode();
		paragraph.append(node);
		return paragraph;
	});

	const rootNode = $getRoot();
	rootNode.clear();
	rootNode.append(...lexicalNodes);

	console.log('Import', {
		rawMarkdown,
		mdTree,
		transformedNodes: lexicalNodes,
		rootNode: rootNode.exportJSON(),
	});
};

export const $convertToMarkdownString = () => {
	const rootNode = $getRoot();

	const convertToMarkdownNode = (node: LexicalNode): Content => {
		if ($isParagraphNode(node)) {
			const paragraph = u('paragraph', { children: [] }) as Paragraph;

			const nestedNodes = node.getChildren();
			if (
				nestedNodes.length === 0 ||
				(nestedNodes.every((node) => $isTextNode(node)) &&
					node.getTextContent().trim().length === 0)
			) {
				paragraph.children.push(u('text', { value: '' }) satisfies Text);
				return paragraph;
			}

			for (const child of node.getChildren()) {
				const content = convertToMarkdownNode(child);
				paragraph.children.push(content as any);
			}

			return paragraph;
		}

		if ($isImageNode(node)) {
			return u('image', {
				url: node.getSrc(),
				alt: node.getAltText(),
			}) satisfies Image;
		}

		if ($isTextNode(node)) {
			if (node.hasFormat('code')) {
				return u('inlineCode', {
					value: node.getTextContent(),
				}) satisfies InlineCode;
			}

			return u('text', { value: node.getTextContent() }) satisfies Text;
		}

		if ($isCodeNode(node)) {
			return u('code', {
				lang: node.getLanguage(),
				value: node.getTextContent(),
			}) satisfies Code;
		}

		if ($isFormattingNode(node)) {
			const tagName = node.getTagName();
			switch (tagName) {
				case 'em': {
					return u('emphasis', {
						children: node
							.getChildren()
							.map(convertToMarkdownNode) as Emphasis['children'],
					}) satisfies Emphasis;
				}
				case 'del': {
					return u('delete', {
						children: node
							.getChildren()
							.map(convertToMarkdownNode) as Delete['children'],
					}) satisfies Delete;
				}
				case 'b': {
					return u('strong', {
						children: node
							.getChildren()
							.map(convertToMarkdownNode) as Strong['children'],
					}) satisfies Strong;
				}
			}
		}

		if ($isHorizontalRuleNode(node)) {
			return u('thematicBreak') satisfies ThematicBreak;
		}

		if ($isListNode(node)) {
			return u('list', {
				ordered: node.getTag() === 'ol',
				start: node.getStart(),
				spread: false,
				children: node
					.getChildren()
					.map(convertToMarkdownNode) as List['children'],
			}) satisfies List;
		}
		if ($isListItemNode(node)) {
			return u('listItem', {
				spread: false,
				checked: node.getChecked(),
				children: [
					u('paragraph', {
						children: node
							.getChildren()
							.map(convertToMarkdownNode) as Paragraph['children'],
					}) as Paragraph,
				],
			}) satisfies ListItem;
		}

		if ($isLinkNode(node)) {
			return u('link', {
				url: node.getURL(),
				alt: node.getTitle(),
				children: node
					.getChildren()
					.map(convertToMarkdownNode) as Link['children'],
			}) satisfies Link;
		}

		if ($isQuoteNode(node)) {
			return u('blockquote', {
				children: node
					.getChildren()
					.map(convertToMarkdownNode) as Blockquote['children'],
			}) satisfies Blockquote;
		}

		if ($isTableNode(node)) {
			return u('table', {
				children: node
					.getChildren()
					.map(convertToMarkdownNode) as Table['children'],
			}) satisfies Table;
		}
		if ($isTableRowNode(node)) {
			return u('tableRow', {
				children: node
					.getChildren()
					.map(convertToMarkdownNode) as TableRow['children'],
			}) satisfies TableRow;
		}
		if ($isTableCellNode(node)) {
			return u('tableCell', {
				children: node
					.getChildren()
					.map(convertToMarkdownNode) as TableCell['children'],
			}) satisfies TableCell;
		}

		if ($isLineBreakNode(node)) {
			return u('break', {}) satisfies Break;
		}

		if ($isHeadingNode(node)) {
			const depth = Math.max(
				1,
				Math.min(parseInt(node.getTag().slice(1)), 6),
			) as Heading['depth'];
			return u('heading', {
				depth: depth,
				children: node
					.getChildren()
					.map(convertToMarkdownNode) as Heading['children'],
			}) satisfies Heading;
		}

		// Default node
		return u('html', { value: node.getTextContent() }) as HTML;
	};

	const children = rootNode.getChildren();
	const mdTree = u('root', {
		children: children.map(convertToMarkdownNode),
	}) satisfies Root;

	const serializedData = markdownProcessor.stringify(mdTree);

	console.log('EXPORT', {
		serializedData,
		rootNode: rootNode.exportJSON(),
		children,
		mdTree,
	});
	return serializedData;
};
