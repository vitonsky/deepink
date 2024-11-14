/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable spellcheck/spell-checker */

import {
	$applyNodeReplacement,
	DOMConversionMap,
	DOMConversionOutput,
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

function $convertPreElement(domNode: Node): null | DOMConversionOutput {
	if (!(domNode instanceof HTMLPreElement)) {
		return null;
	}
	const node = $createRawNode();
	return { node };
}

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
		const element = document.createElement('pre');
		return { element };
	}

	static importDOM(): DOMConversionMap | null {
		return {
			img: (_node: Node) => ({
				conversion: $convertPreElement,
				priority: 0,
			}),
		};
	}

	constructor(key?: NodeKey) {
		super(key);
	}

	exportJSON(): SerializedRawNode {
		return {
			...super.exportJSON(),
			type: this.getType(),
		};
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
