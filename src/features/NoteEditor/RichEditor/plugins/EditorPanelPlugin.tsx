import { useEffect } from 'react';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$getSelection,
	$hasAncestor,
	$isBlockElementNode,
	$isRangeSelection,
	$isTextNode,
	CONTROLLED_TEXT_INSERTION_COMMAND,
	ElementNode,
	LexicalNode,
} from 'lexical';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $dfs, $findMatchingParent } from '@lexical/utils';

import {
	InsertingPayloadMap,
	TextFormat,
	useEditorPanelContext,
} from '../../EditorPanel';

import {
	$createFormattingNode,
	$isFormattingNode,
	FormattingNode,
} from '../nodes/FormattingNode';
import { $createImageNode } from '../nodes/ImageNode';

// Format
const $getFormatNodes = (node: LexicalNode): FormattingNode[] => {
	return node.getParents().filter((node) => $isFormattingNode(node));
};

const formatMap = {
	bold: 'b',
	italic: 'em',
	strikethrough: 'del',
} satisfies Record<TextFormat, string>;

const $getFormatNode = (node: LexicalNode, format: TextFormat) => {
	const isMatch = (formatNode: FormattingNode) =>
		formatNode.getTagName() === formatMap[format];

	if ($isFormattingNode(node) && isMatch(node)) {
		return node;
	}

	return $getFormatNodes(node).find(isMatch) ?? null;
};

const $setFormatNode = (node: LexicalNode, format: TextFormat) => {
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

const $insertAfter = (target: LexicalNode, nodes: LexicalNode[]) => {
	const nodesList = [...nodes].reverse();
	for (let lastNode: LexicalNode | null = target; lastNode;) {
		const node = nodesList.pop();

		if (node) {
			lastNode.insertAfter(node);
		}

		lastNode = node ?? null;
	}
};

const $removeFormatNode = (node: LexicalNode, format: TextFormat) => {
	const parentFormat = $getFormatNode(node, format);
	if (!parentFormat) return;

	$insertAfter(parentFormat, parentFormat.getChildren());
};

const $toggleFormatNode = (node: LexicalNode, format: TextFormat) => {
	const parentFormat = $getFormatNode(node, format);

	if (!parentFormat) {
		$setFormatNode(node, format);
	} else {
		$removeFormatNode(node, format);
	}
};

// Insertion
export const $canInsertElementsToNode = (node: LexicalNode) => {
	if ($isTextNode(node)) return false;

	// Check for parents
	let currentNode: LexicalNode | null = node;
	while (currentNode !== null) {
		if ($isCodeNode(currentNode)) return false;
		currentNode = currentNode.getParent();
	}

	return true;
};

export const $findCommonAncestor = (
	startNode: LexicalNode,
	nodes: LexicalNode[],
	filter: (node: LexicalNode) => boolean = () => true,
) => {
	if (nodes.length === 1 && startNode.is(nodes[0]) && filter(startNode)) {
		return startNode;
	}

	return $findMatchingParent(startNode, (parent) => {
		return (
			nodes.every((selectedNode) => $hasAncestor(selectedNode, parent)) &&
			$canInsertElementsToNode(parent)
		);
	});
};

export const $wrapNodes = (createElement: (nodes: LexicalNode[]) => ElementNode) => {
	const selection = $getSelection();

	const points = selection?.getStartEndPoints();
	if (!selection || !points) return;

	const [start, end] = points;

	if (
		$isRangeSelection(selection) &&
		(start.getNode() !== end.getNode() || start.offset !== end.offset)
	) {
		const selectedNodes = selection.getNodes();
		const anchorNode = selection.anchor.getNode();
		const commonAncestor =
			$findMatchingParent(
				anchorNode,
				(parent) =>
					selectedNodes.every((selectedNode) =>
						$hasAncestor(selectedNode, parent),
					) && $canInsertElementsToNode(parent),
			) ?? $getRoot();
		if (!commonAncestor || !$isBlockElementNode(commonAncestor)) return;

		// In case common ancestor is not direct parent of any node,
		// current implementation will drop that case and will not wrap such selection.
		// Otherwise, we would have to ensure nodes integrity
		const firstChildNode = commonAncestor
			.getChildren()
			.find((children) => selectedNodes.includes(children));
		if (!firstChildNode) return;

		const tmpNode = $createParagraphNode();
		firstChildNode.insertBefore(tmpNode);

		const topSelectedNodes = selectedNodes.filter((node) =>
			commonAncestor.is(node.getParent()),
		);

		console.warn('FINAL STEP', {
			commonAncestor,
			topSelectedNodes,
			selectedNodes,
			parents: selectedNodes.map((node) => node.getParent()),
		});
		tmpNode.replace(createElement(topSelectedNodes));

		return;
	}

	const blockElement = $findMatchingParent(
		start.getNode(),
		(node) => $isBlockElementNode(node) && !node.isParentRequired(),
	) as ElementNode | null;

	if (!blockElement) return;

	const tmpNode = $createParagraphNode();
	blockElement.replace(tmpNode);
	tmpNode.replace(createElement([blockElement]));
};

// TODO: implement all inserting & formatting features
export const EditorPanelPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const { onInserting, onFormatting } = useEditorPanelContext();

	useEffect(() => {
		const cleanupFormatting = onFormatting.watch((format) => {
			console.log('Format text', format);

			// TODO: support formatting selected text slices
			editor.update(() => {
				const selection = $getSelection();
				if (!selection) return;

				const nodes = selection.getNodes();
				if (nodes.length === 0) return;

				const commonAncestor = $findCommonAncestor(nodes[0], nodes, (node) =>
					$dfs(node).some(({ node }) => $isCodeNode(node)),
				);
				if (!commonAncestor) return;

				$toggleFormatNode(commonAncestor, format);
			});
		});

		const cleanupInserting = onInserting.watch((evt) => {
			const commands: {
				[K in keyof InsertingPayloadMap]?: (
					payload: InsertingPayloadMap[K],
				) => void;
			} = {
				horizontalRule() {
					editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
				},
				date({ date }) {
					editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, date);
				},
				quote() {
					editor.update(() => {
						$wrapNodes((nodes) => {
							const quote = $createQuoteNode();
							quote.append(...nodes);
							return quote;
						});
					});
				},
				code() {
					editor.update(() => {
						$wrapNodes((nodes) => {
							const code = $createCodeNode();

							const textContent = nodes
								.map(
									(node) =>
										node.getTextContent() +
										($isBlockElementNode(node) ? '\n' : ''),
								)
								.join('');
							nodes.forEach((node) => node.remove());

							code.append($createTextNode(textContent));
							code.select();

							return code;
						});
					});
				},
				link({ url }) {
					editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url });
				},
				image({ url, altText }) {
					editor.update(() => {
						const selection = $getSelection();
						if (!selection) return;

						const anchorNode = $isRangeSelection(selection)
							? selection.anchor.getNode()
							: selection.getNodes()[0];

						let targetNode: LexicalNode | null = anchorNode;
						const parent = targetNode.getParent();
						if (parent && !$canInsertElementsToNode(parent)) {
							const parents = targetNode.getParents();
							targetNode = null;

							for (let i = parents.length - 2; i > 0; i++) {
								const target = parents[i + 1];
								const parent = parents[i];

								if (!$canInsertElementsToNode(parent)) continue;
								targetNode = target;
							}

							if (!targetNode) return;
						}

						targetNode.insertAfter($createImageNode({ src: url, altText }));
					});
				},
				list({ type }) {
					switch (type) {
						case 'checkbox':
							editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
							break;
						case 'ordered':
							editor.dispatchCommand(
								INSERT_ORDERED_LIST_COMMAND,
								undefined,
							);
							break;
						case 'unordered':
							editor.dispatchCommand(
								INSERT_UNORDERED_LIST_COMMAND,
								undefined,
							);
							break;
					}
				},
				heading({ level }) {
					editor.update(() => {
						const selection = $getSelection();
						if (!selection) return;

						const points = selection.getStartEndPoints();
						if (!points) return;

						const target = points[0].getNode();
						if (!target) return;

						const parent = target.getParent();
						if (parent && !$canInsertElementsToNode(parent)) return;

						// Insert
						if ($isTextNode(target)) {
							const heading = $createHeadingNode(`h${level}`);

							target.replace(heading);
							heading.append(target);
							heading.select();
						} else {
							const heading = $createHeadingNode(`h${level}`);
							target.insertBefore(heading);
							heading.select();
						}
					});
				},
			};

			const command = commands[evt.type];
			if (command) {
				// @ts-ignore
				command(evt.data);
			}
		});

		return () => {
			cleanupFormatting();
			cleanupInserting();
		};
	}, [editor, onFormatting, onInserting]);

	return null;
};
