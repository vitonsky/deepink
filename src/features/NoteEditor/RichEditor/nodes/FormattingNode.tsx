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

export type SerializedFormattingNode = Spread<
	{
		content: string;
	},
	SerializedElementNode
>;

function $convertPreElement(domNode: Node): null | DOMConversionOutput {
	if (!(domNode instanceof HTMLElement)) {
		return null;
	}

	const node = $createFormattingNode({ tag: domNode.tagName.toLowerCase() });
	return { node };
}

export class FormattingNode extends ElementNode {
	__tagName: string;

	static getType(): string {
		return 'formatting';
	}

	static clone(node: FormattingNode): FormattingNode {
		return new FormattingNode(node.__tagName, node.__key);
	}

	static importJSON(serializedNode: SerializedFormattingNode): FormattingNode {
		const { content } = serializedNode;
		return $createFormattingNode({ tag: content });
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

	exportJSON(): SerializedFormattingNode {
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

export function $createFormattingNode({
	tag,
	key,
}: FormattingNodePayload): FormattingNode {
	return $applyNodeReplacement(new FormattingNode(tag, key));
}

export function $isFormattingNode(
	node: LexicalNode | null | undefined,
): node is FormattingNode {
	return node instanceof FormattingNode;
}
