import { $getSelection, LexicalNode } from 'lexical';

export const $insertAfter = (target: LexicalNode, nodes: LexicalNode[]) => {
	const nodesList = [...nodes].reverse();
	for (let lastNode: LexicalNode | null = target; lastNode; ) {
		const node = nodesList.pop();

		if (node) {
			lastNode.insertAfter(node);
		}

		lastNode = node ?? null;
	}
};

export const $getCursorNode = () => {
	const selection = $getSelection();
	if (!selection) return null;

	const points = selection.getStartEndPoints();
	if (!points) return null;

	const point = selection.isBackward() ? points[0] : points[1];
	return point.getNode();
};
