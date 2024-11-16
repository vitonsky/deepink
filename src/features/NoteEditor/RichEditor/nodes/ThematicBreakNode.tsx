/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable spellcheck/spell-checker */

import {
	$applyNodeReplacement,
	DecoratorNode,
	DOMExportOutput,
	LexicalNode,
	NodeKey,
} from 'lexical';

export interface ThematicBreakNodePayload {
	key?: NodeKey;
}

export type SerializedThematicBreakNode = {
	type: string;
	version: number;
};

export class ThematicBreakNode extends DecoratorNode<null> {
	static getType(): string {
		return 'thematic-break';
	}

	static clone(node: ThematicBreakNode): ThematicBreakNode {
		return new ThematicBreakNode(node.__key);
	}

	static importJSON(): ThematicBreakNode {
		return $createThematicBreakNode();
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement('hr');
		return { element };
	}

	constructor(key?: NodeKey) {
		super(key);
	}

	exportJSON(): SerializedThematicBreakNode {
		return {
			version: 1,
			type: this.getType(),
		};
	}

	// View

	createDOM(): HTMLElement {
		const element = document.createElement('hr');
		return element;
	}

	updateDOM(): false {
		return false;
	}

	decorate() {
		return null;
	}
}

export function $createThematicBreakNode({
	key,
}: ThematicBreakNodePayload = {}): ThematicBreakNode {
	return $applyNodeReplacement(new ThematicBreakNode(key));
}

export function $isThematicBreakNode(
	node: LexicalNode | null | undefined,
): node is ThematicBreakNode {
	return node instanceof ThematicBreakNode;
}
