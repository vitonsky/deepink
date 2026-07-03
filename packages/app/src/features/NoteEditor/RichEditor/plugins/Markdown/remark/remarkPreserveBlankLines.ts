import { type Root, RootContent } from 'mdast';
import { Plugin } from 'unified';
import { CONTINUE, SKIP, visit } from 'unist-util-visit';

export const remarkPreserveBlankLines: Plugin<[], Root> = () => {
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
