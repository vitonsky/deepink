/* eslint-disable @typescript-eslint/no-use-before-define */
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isParagraphNode,
	$isTextNode,
	IS_CODE,
	LexicalNode,
} from 'lexical';
import {
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
	Text,
} from 'mdast';
// import remarkBreaks from 'remark-breaks';
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
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';

import {
	$createFormattingNodeNode,
	$isFormattingNodeNode,
} from '../nodes/FormattingNode';
import { $createImageNode, $isImageNode } from '../nodes/ImageNode';
import { $createRawTextNode } from '../nodes/RawTextNode';

const markdownProcessor = unified()
	.use(remarkParse)
	// .use(remarkParseFrontmatter)
	// .use(remarkFrontmatter, ['yaml', 'toml'])
	.use(remarkGfm)
	// .use(remarkBreaks)
	.use(remarkStringify, {
		bullet: '-',
		listItemIndent: 'one',
		join: [
			(left, right) => {
				console.log(left, right);
				return 0;
			},
		],
	})
	.freeze();

const dumpMarkdownNode = (node: Content) =>
	markdownProcessor.stringify(
		u('root', {
			children: [node],
		}) satisfies Root,
	);

export const $convertFromMarkdownString = (rawMarkdown: string) => {
	const mdTree = markdownProcessor.parse(rawMarkdown);

	function transformMdNode(node: Content): LexicalNode {
		switch (node.type) {
			case 'text': {
				return $createTextNode(node.value);
			}
			case 'paragraph': {
				const paragraph = $createParagraphNode();
				paragraph.append(...transformMdTree(node.children));

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
				heading.append(...transformMdTree(node.children));

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
				list.append(...transformMdTree(node.children));

				return list;
			}
			case 'listItem': {
				const listItem = $createListItemNode(node.checked ?? undefined);
				listItem.append(...transformMdTree(node.children));

				return listItem;
			}
			case 'link': {
				const link = $createLinkNode(node.url, { title: node.title });
				link.append(...transformMdTree(node.children));

				return link;
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
				const format = $createFormattingNodeNode({ tag: 'em' });
				format.append(...transformMdTree(node.children));

				return format;
			}
			case 'strong': {
				const format = $createFormattingNodeNode({ tag: 'b' });
				format.append(...transformMdTree(node.children));

				return format;
			}
			case 'delete': {
				const format = $createFormattingNodeNode({ tag: 'del' });
				format.append(...transformMdTree(node.children));

				return format;
			}
		}

		// console.log("Unknown node", node);
		return $createRawTextNode({ content: dumpMarkdownNode(node) });
	}

	function transformMdTree(mdTree: Content[]): LexicalNode[] {
		const lexicalTree: LexicalNode[] = [];

		let lastNode: Content | null = null;
		for (const mdNode of mdTree) {
			// Insert line breaks
			if (
				lastNode !== null &&
				lastNode.position &&
				mdNode !== null &&
				mdNode.position
			) {
				const missedLines =
					mdNode.position.start.line - lastNode.position.end.line;

				console.log('Missed lines', missedLines);
				for (let i = 0; i < missedLines - 1; i++) {
					lexicalTree.push($createParagraphNode());
				}

				// if (missedLines > 0) {
				// 	const p = $createParagraphNode();
				// 	p.append($createTextNode('\n'.repeat(missedLines)));
				// 	lexicalTree.push(p);
				// }
			}

			lastNode = mdNode;
			lexicalTree.push(transformMdNode(mdNode));
		}

		return lexicalTree;
	}

	const transformedNodes = transformMdTree(mdTree.children).map((node) => {
		if (!$isTextNode(node)) return node;

		const paragraph = $createParagraphNode();
		paragraph.append(node);
		return paragraph;
	});

	const rootNode = $getRoot();
	rootNode.clear();
	rootNode.append(...transformedNodes);

	console.log('Import', {
		rawMarkdown,
		mdTree,
		transformedNodes,
		rootNode: rootNode.exportJSON(),
	});
};

// const transformers = [
// 	{
// 		node: ImageNode,
// 		transform: (node: ImageNode) => {
// 			return u('image', {
// 				url: node.getSrc(),
// 				alt: node.getAltText(),
// 			}) satisfies Image;
// 		}
// 	},
// 	{
// 		node: ParagraphNode,
// 		transform: (node: ParagraphNode, children?: ChildNode[]) => {
// 			return u('paragraph', { children: children ?? [] }) satisfies Paragraph;
// 		}
// 	},
// ];
export const $convertToMarkdownString = () => {
	const rootNode = $getRoot();

	const transformMdASTNode = (node: LexicalNode): Content => {
		// $isElementNode(node) && node.getIndent();
		if ($isParagraphNode(node)) {
			// if (node.getTextContent().trim().length === 0) {
			// 	return u('break') as Break;
			// }

			const paragraph = u('paragraph', { children: [] }) as Paragraph;

			const nestedNodes = node.getChildren();
			if (
				nestedNodes.length === 0 ||
				(nestedNodes.every((node) => $isTextNode(node)) &&
					node.getTextContent().trim().length === 0)
			) {
				// return u('text', { value: '\n' }) satisfies Text;
				paragraph.children.push(u('text', { value: '' }) satisfies Text);
				return paragraph;
			}

			for (const child of node.getChildren()) {
				const content = transformMdASTNode(child);
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

		if ($isFormattingNodeNode(node)) {
			const tagName = node.getTagName();
			switch (tagName) {
				case 'em': {
					return u('emphasis', {
						children: node
							.getChildren()
							.map(transformMdASTNode) as Emphasis['children'],
					}) satisfies Emphasis;
				}
				case 'del': {
					return u('delete', {
						children: node
							.getChildren()
							.map(transformMdASTNode) as Delete['children'],
					}) satisfies Delete;
				}
				case 'b': {
					return u('strong', {
						children: node
							.getChildren()
							.map(transformMdASTNode) as Strong['children'],
					}) satisfies Strong;
				}
			}
		}

		if ($isListNode(node)) {
			return u('list', {
				ordered: node.getTag() === 'ol',
				start: node.getStart(),
				spread: false,
				children: node.getChildren().map(transformMdASTNode) as List['children'],
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
							.map(transformMdASTNode) as Paragraph['children'],
					}) as Paragraph,
				],
			}) satisfies ListItem;
		}

		if ($isLinkNode(node)) {
			return u('link', {
				url: node.getURL(),
				alt: node.getTitle(),
				children: node.getChildren().map(transformMdASTNode) as Link['children'],
			}) satisfies Link;
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
					.map(transformMdASTNode) as Heading['children'],
			}) satisfies Heading;
		}

		// Default node
		return u('html', { value: node.getTextContent() }) as HTML;
	};

	const childs = rootNode.getChildren();
	const mdTree = u('root', {
		children: childs.map(transformMdASTNode),
	}) satisfies Root;

	const serializedData = markdownProcessor.stringify(mdTree);

	console.log('EXPORT', {
		serializedData,
		rootNode: rootNode.exportJSON(),
		childs,
		mdTree,
	});
	return serializedData;
};
