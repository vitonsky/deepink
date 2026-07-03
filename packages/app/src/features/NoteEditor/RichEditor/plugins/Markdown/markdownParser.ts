/* eslint-disable @typescript-eslint/no-use-before-define */
import {
	$createLineBreakNode,
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isTextNode,
	IS_CODE,
	LexicalNode,
} from 'lexical';
import {
	Content,
	type Delete,
	type Emphasis,
	type PhrasingContent,
	type Root,
	RootContent,
	type Strong,
} from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { Plugin, unified } from 'unified';
import { u } from 'unist-builder';
import { CONTINUE, SKIP, visit } from 'unist-util-visit';
import { TextFormat } from '@features/NoteEditor/EditorPanel';
import { $createCodeNode } from '@lexical/code';
import { $createLinkNode } from '@lexical/link';
import { $createListItemNode, $createListNode, ListType } from '@lexical/list';
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
	$createTableCellNode,
	$createTableNode,
	$createTableRowNode,
	TableCellHeaderStates,
} from '@lexical/table';

import { $createImageNode } from '../Image/ImageNode';
import { convertLexicalNodeToMarkdownNode } from './convertLexicalNodeToMarkdownNode';
import { createSyncContext } from './createSyncContext';
import { $createRawNode } from './nodes/RawNode';

const remarkPreserveBlankLines: Plugin<[], Root> = () => {
	const ignoredNodeTypes = new Set<string>([
		'table',
		'tableCell',
		'tableRow',
	] satisfies RootContent['type'][]);

	return (tree: Root) => {
		const skipNodes = new Set<unknown>();

		visit(tree, (node) => {
			// Skip nodes with no nested elements
			if (!('children' in node)) return SKIP;

			// Skip ignored node types
			if (ignoredNodeTypes.has(node.type)) return SKIP;

			// Skip already handled nodes
			if (skipNodes.has(node)) return SKIP;

			const newChildren: RootContent[] = [];
			for (let i = 0; i < node.children.length; i++) {
				const current = node.children[i];
				const next = node.children[i + 1];

				// Collect its own children
				newChildren.push(current);

				// Add empty lines to preserve
				if (next && current.position && next.position) {
					const lineGap = next.position.start.line - current.position.end.line;
					// lineGap === 2 means exactly one blank line, 3 means two, etc.
					const blankLineCount = lineGap - 1;

					for (let b = 0; b < blankLineCount; b++) {
						const line = current.position.end.line + 1 + b;
						const emptyLine = {
							type: 'paragraph',
							children: [],
							// TODO: add tests to verify position are correct in complex cases
							position: {
								start: { line, column: 1, offset: 0 },
								end: { line, column: 1, offset: 0 },
							},
						} as RootContent;

						newChildren.push(emptyLine);
						skipNodes.add(emptyLine);
					}
				}
			}

			node.children = newChildren;

			return CONTINUE;
		});
	};
};

/**
 * Formatting node types treated as pure "marks": they wrap exactly one
 * thing and carry no data of their own (unlike e.g. `link`/`image`), so
 * they can be freely merged, split and re-nested.
 *
 * The ORDER here is significant: it's the canonical outer -> inner nesting
 * order that lifted formatting gets rebuilt in, regardless of whatever
 * (possibly inconsistent) order the input used. Add more types here to
 * support lifting them too - no other code needs to change.
 */
const MARK_ORDER = ['emphasis', 'strong', 'delete'] satisfies (
	| Emphasis['type']
	| Strong['type']
	| Delete['type']
)[];

type Mark = (typeof MARK_ORDER)[number];
type MarkNode = Emphasis | Strong | Delete;

const MARK_TYPES = new Set<string>(MARK_ORDER);

function isMarkNode(node: PhrasingContent): node is MarkNode {
	return MARK_TYPES.has(node.type);
}

function hasChildren(
	node: PhrasingContent,
): node is PhrasingContent & { children: PhrasingContent[] } {
	return (
		'children' in node &&
		Array.isArray((node as { children?: unknown }).children) &&
		(node as { children: unknown[] }).children.length > 0
	);
}

/** Flattened leaf: some content plus the set of marks wrapping it. */
interface Leaf {
	content: PhrasingContent;
	marks: Set<Mark>;
}

/**
 * Descends through a chain of single-child mark wrappers, collecting every
 * mark found along the way, stopping at the first node that either isn't a
 * mark node or doesn't have exactly one child. That stopping node's own
 * children (if any) are recursively re-lifted, so formatting nested inside
 * e.g. links, or inside already-multi-child mark nodes, is still
 * normalized without being lifted past a boundary it shouldn't cross.
 */
function flattenToLeaf(node: PhrasingContent, marks: Set<Mark>): Leaf {
	if (isMarkNode(node) && node.children.length === 1) {
		marks.add(node.type);
		return flattenToLeaf(node.children[0], marks);
	}

	if (hasChildren(node))
		return {
			content: {
				...node,
				children: liftChildren(node.children),
			} as PhrasingContent,
			marks,
		};

	return { content: node, marks };
}

/**
 * Rebuilds a flat list of leaves into a tree: for each position, finds the
 * highest-priority mark (per `MARK_ORDER`, starting search at `orderIndex`)
 * present on that leaf, groups the maximal run of subsequent leaves that
 * also carry it under one new node, and recurses on the remaining marks.
 * Leaves with no remaining marks are emitted as-is.
 */
function rebuildFromLeaves(leaves: Leaf[], orderIndex: number): PhrasingContent[] {
	const result: PhrasingContent[] = [];
	let i = 0;

	while (i < leaves.length) {
		let markIndex = orderIndex;
		while (
			markIndex < MARK_ORDER.length &&
			!leaves[i].marks.has(MARK_ORDER[markIndex])
		)
			markIndex++;

		if (markIndex === MARK_ORDER.length) {
			result.push(leaves[i].content);
			i++;
			continue;
		}

		const mark = MARK_ORDER[markIndex];
		const group: Leaf[] = [];

		while (i < leaves.length && leaves[i].marks.has(mark)) {
			leaves[i].marks.delete(mark);
			group.push(leaves[i]);
			i++;
		}

		result.push({
			type: mark,
			children: rebuildFromLeaves(group, markIndex + 1),
		} as PhrasingContent);
	}

	return result;
}

/** Lifts/normalizes formatting across one run of sibling phrasing content. */
function liftChildren(children: PhrasingContent[]): PhrasingContent[] {
	return rebuildFromLeaves(
		children.map((child) => flattenToLeaf(child, new Set())),
		0,
	);
}

export default function remarkLiftFormatting() {
	return (tree: Root) => {
		visit(tree, ['paragraph', 'tableCell'], (node) => {
			if ('children' in node) {
				node.children = liftChildren(node.children as PhrasingContent[]);
			}
			return SKIP;
		});
	};
}

export const markdownProcessor = unified()
	.use(remarkParse)
	.use(remarkPreserveBlankLines)
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

export const parseMarkdownToAST = (source: string) => {
	return markdownProcessor.runSync(markdownProcessor.parse(source));
};

export const dumpMarkdownNode = (node: Content) => {
	const content = markdownProcessor.stringify(
		u('root', {
			children: [node],
		}) satisfies Root,
	);

	if (content.endsWith('\n')) {
		return content.slice(0, -1);
	}

	return content;
};

export const $wrapWithParagraph = (children: LexicalNode[]) => {
	const p = $createParagraphNode();
	p.append(...children);

	return p;
};

export const $convertFromMarkdownString = (rawMarkdown: string) => {
	const mdTree = parseMarkdownToAST(rawMarkdown);

	const textFormatContext = createSyncContext<TextFormat[]>([]);
	function convertToMarkdownNode(node: Content): LexicalNode[] {
		switch (node.type) {
			case 'text': {
				const t = $createTextNode(node.value);
				textFormatContext.get().forEach((format) => t.toggleFormat(format));
				return [t];
			}
			case 'paragraph': {
				const paragraph = $createParagraphNode();
				paragraph.append(...convertToMarkdownNodes(node.children));

				return [paragraph];
			}
			case 'image': {
				return [
					$createImageNode({
						src: node.url,
						altText: node.alt || '',
					}),
				];
			}
			case 'heading': {
				const heading = $createHeadingNode(`h${node.depth}`);
				heading.append(...convertToMarkdownNodes(node.children));

				return [heading];
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

				return [list];
			}
			case 'listItem': {
				const listItem = $createListItemNode(node.checked ?? undefined);
				listItem.append(
					$wrapWithParagraph(convertToMarkdownNodes(node.children)),
				);

				return [listItem];
			}
			case 'link': {
				const link = $createLinkNode(node.url, { title: node.title });
				link.append(...convertToMarkdownNodes(node.children));

				return [link];
			}
			case 'blockquote': {
				const quote = $createQuoteNode();
				quote.append(...convertToMarkdownNodes(node.children));

				return [quote];
			}
			case 'table': {
				const table = $createTableNode();
				table.append(...convertToMarkdownNodes(node.children));
				return [table];
			}
			case 'tableRow': {
				const tableRow = $createTableRowNode();
				tableRow.append(...convertToMarkdownNodes(node.children));
				return [tableRow];
			}
			case 'tableCell': {
				const tableCell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);

				const p = $createParagraphNode();
				p.append(...convertToMarkdownNodes(node.children));
				tableCell.append(p);

				return [tableCell];
			}
			case 'code': {
				const code = $createCodeNode(node.lang);
				code.append($createTextNode(node.value));

				return [code];
			}
			case 'inlineCode': {
				const text = $createTextNode(node.value);
				text.setFormat(IS_CODE);
				return [text];
			}
			// TODO: handle sub/super/etc
			case 'emphasis':
			case 'strong':
			case 'delete': {
				return textFormatContext.use(
					[
						...textFormatContext.get(),
						(
							{
								emphasis: 'italic',
								strong: 'bold',
								delete: 'strikethrough',
							} satisfies Record<string, TextFormat>
						)[node.type],
					],
					() => convertToMarkdownNodes(node.children),
				);
			}
			case 'break': {
				return [$createLineBreakNode()];
			}
			case 'thematicBreak': {
				return [$createHorizontalRuleNode()];
			}
		}

		const rawNode = $createRawNode();
		rawNode.append($createTextNode(dumpMarkdownNode(node)));
		return [rawNode];
	}

	function convertToMarkdownNodes(mdTree: Content[]): LexicalNode[] {
		const lexicalTree: LexicalNode[] = [];
		for (const mdNode of mdTree) {
			lexicalTree.push(...convertToMarkdownNode(mdNode));
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
};

export const $serializeAsMarkdownAST = () => {
	const rootNode = $getRoot();
	const children = rootNode.getChildren();

	const tree = u('root', {
		children: children.map(convertLexicalNodeToMarkdownNode),
	}) satisfies Root;

	remarkLiftFormatting()(tree);

	return tree;
};

export const $convertToMarkdownString = () => {
	return markdownProcessor.stringify($serializeAsMarkdownAST());
};
