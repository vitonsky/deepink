/* eslint-disable @typescript-eslint/no-use-before-define */
import type { Delete, Emphasis, PhrasingContent, Root, RootContent, Strong } from 'mdast';
import { SKIP, visit } from 'unist-util-visit';

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

export function hasChildren(
	node: RootContent,
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
 * Rebuilds a flat list of leaves into a tree. Marks already consumed are
 * removed from each leaf's `Set`, so scanning `MARK_ORDER` from the start
 * every time is both safe (can't re-select a consumed mark) and necessary:
 * different leaves inside the same run may carry different subsets of
 * marks, so the "next" priority mark to lift can legitimately be one that
 * comes *before* a mark that was just grouped one level up.
 */
function rebuildFromLeaves(leaves: Leaf[]): PhrasingContent[] {
	const result: PhrasingContent[] = [];
	let i = 0;

	while (i < leaves.length) {
		let markIndex = 0;
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
			children: rebuildFromLeaves(group),
		} as PhrasingContent);
	}

	return result;
}

function liftChildren(children: PhrasingContent[]): PhrasingContent[] {
	return rebuildFromLeaves(children.map((child) => flattenToLeaf(child, new Set())));
}

export const liftFormattingNodes = (tree: Root) => {
	visit(
		tree,
		['heading', 'paragraph', 'tableCell'] satisfies RootContent['type'][],
		(node) => {
			if ('children' in node) {
				node.children = liftChildren(node.children);
			}
			return SKIP;
		},
	);

	return tree;
};

export default function remarkLiftFormatting() {
	return liftFormattingNodes;
}
