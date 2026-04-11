/* eslint-disable @typescript-eslint/no-use-before-define */

import {
	$applyNodeReplacement,
	DOMExportOutput,
	ElementNode,
	LexicalNode,
	NodeKey,
	SerializedElementNode,
	Spread,
} from 'lexical';

export interface RawTextPayload {
	key?: NodeKey;
}

export type SerializedRawNode = Spread<{}, SerializedElementNode>;

export class RawNode extends ElementNode {
	static getType(): string {
		return 'raw';
	}

	static clone(node: RawNode): RawNode {
		return new RawNode(node.__key);
	}

	static importJSON(_serializedNode: SerializedRawNode): RawNode {
		return $createRawNode();
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement('span');
		return { element };
	}

	exportJSON(): SerializedRawNode {
		return {
			...super.exportJSON(),
			type: this.getType(),
		};
	}

	isInline() {
		return true;
	}

	// View

	createDOM(): HTMLElement {
		const span = document.createElement('span');
		return span;
	}

	updateDOM(): false {
		return false;
	}
}

export function $createRawNode({ key }: RawTextPayload = {}): RawNode {
	return $applyNodeReplacement(new RawNode(key));
}

export function $isRawNode(node: LexicalNode | null | undefined): node is RawNode {
	return node instanceof RawNode;
}
