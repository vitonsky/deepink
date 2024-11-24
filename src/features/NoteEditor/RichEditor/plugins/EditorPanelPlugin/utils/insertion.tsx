import {
	$createParagraphNode,
	$getRoot,
	$getSelection,
	$hasAncestor,
	$isBlockElementNode,
	$isRangeSelection,
	$isTextNode,
	ElementNode,
	LexicalNode,
} from 'lexical';
import { $isCodeNode } from '@lexical/code';
import { $findMatchingParent } from '@lexical/utils';

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
