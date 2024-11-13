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

export interface FormattingNodePayload {
	tag: string;
	key?: NodeKey;
}

export type SerializedFormattingNodeNode = Spread<
	{
		content: string;
	},
	SerializedElementNode
>;

function $convertPreElement(domNode: Node): null | DOMConversionOutput {
	if (!(domNode instanceof HTMLElement)) {
		return null;
	}

	const node = $createFormattingNodeNode({ tag: domNode.tagName.toLowerCase() });
	return { node };
}

export class FormattingNodeNode extends ElementNode {
	__tagName: string;

	static getType(): string {
		return 'formatting';
	}

	static clone(node: FormattingNodeNode): FormattingNodeNode {
		return new FormattingNodeNode(node.__tagName, node.__key);
	}

	static importJSON(serializedNode: SerializedFormattingNodeNode): FormattingNodeNode {
		const { content } = serializedNode;
		return $createFormattingNodeNode({ tag: content });
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement('pre');
		element.innerText = this.__tagName;
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

	constructor(tagName: string, key?: NodeKey) {
		super(key);
		this.__tagName = tagName;
	}

	exportJSON(): SerializedFormattingNodeNode {
		return {
			...super.exportJSON(),
			type: this.getType(),
			content: this.getTextContent(),
		};
	}

	getTagName() {
		return this.__tagName;
	}

	// View

	createDOM(): HTMLElement {
		const element = document.createElement(this.__tagName);
		return element;
	}

	updateDOM(): false {
		return false;
	}
}

export function $createFormattingNodeNode({
	tag,
	key,
}: FormattingNodePayload): FormattingNodeNode {
	return $applyNodeReplacement(new FormattingNodeNode(tag, key));
}

export function $isFormattingNodeNode(
	node: LexicalNode | null | undefined,
): node is FormattingNodeNode {
	return node instanceof FormattingNodeNode;
}
