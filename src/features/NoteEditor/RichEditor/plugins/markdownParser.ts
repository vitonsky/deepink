/* eslint-disable @typescript-eslint/no-use-before-define */
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isParagraphNode,
	$isTextNode,
	IS_BOLD,
	IS_ITALIC,
	LexicalNode,
} from 'lexical';
import { Content, Image, Paragraph, Root, Text } from 'mdast';
// import remarkBreaks from 'remark-breaks';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { u } from 'unist-builder';

import { $createImageNode, $isImageNode } from '../nodes/ImageNode';

const markdownProcessor = unified()
	.use(remarkParse)
	.use(remarkParseFrontmatter)
	.use(remarkFrontmatter, ['yaml', 'toml'])
	.use(remarkGfm)
	// .use(remarkBreaks)
	.use(remarkStringify, {
		unsafe: [],
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

export const $convertFromMarkdownString = (rawMarkdown: string) => {
	const mdTree = markdownProcessor.parse(rawMarkdown);

	function transformMdNode(node: Content): LexicalNode {
		switch (node.type) {
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
			case 'emphasis': {
				const paragraph = $createParagraphNode();
				paragraph.setTextFormat(IS_ITALIC);

				paragraph.append(...transformMdTree(node.children));

				return paragraph;
			}
			case 'strong': {
				const paragraph = $createParagraphNode();
				paragraph.setTextFormat(IS_BOLD);

				paragraph.append(...transformMdTree(node.children));

				return paragraph;
			}
		}

		const value = 'value' in node ? node.value : '';

		// console.log("Unknown node", value, node);

		return $createTextNode(value);
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

			if (node.getTextContent().trim().length === 0) {
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

		return u('text', { value: node.getTextContent() }) satisfies Text;
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