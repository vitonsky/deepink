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

export type SerializedRawTextNode = Spread<{}, SerializedElementNode>;

function $convertPreElement(domNode: Node): null | DOMConversionOutput {
	if (!(domNode instanceof HTMLPreElement)) {
		return null;
	}
	const node = $createRawTextNode();
	return { node };
}

export class RawTextNode extends ElementNode {
	static getType(): string {
		return 'raw';
	}

	static clone(node: RawTextNode): RawTextNode {
		return new RawTextNode(node.__key);
	}

	static importJSON(_serializedNode: SerializedRawTextNode): RawTextNode {
		return $createRawTextNode();
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

	exportJSON(): SerializedRawTextNode {
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

export function $createRawTextNode({ key }: RawTextPayload = {}): RawTextNode {
	return $applyNodeReplacement(new RawTextNode(key));
}

export function $isRawTextNode(
	node: LexicalNode | null | undefined,
): node is RawTextNode {
	return node instanceof RawTextNode;
}
