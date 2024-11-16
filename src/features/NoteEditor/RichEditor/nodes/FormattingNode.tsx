/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable spellcheck/spell-checker */

import {
	$applyNodeReplacement,
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
		tag: string;
	},
	SerializedElementNode
>;

export class FormattingNode extends ElementNode {
	__tagName: string;

	static getType(): string {
		return 'formatting';
	}

	static clone(node: FormattingNode): FormattingNode {
		return new FormattingNode(node.__tagName, node.__key);
	}

	static importJSON(serializedNode: SerializedFormattingNode): FormattingNode {
		const { tag } = serializedNode;
		return $createFormattingNode({ tag });
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement(this.__tagName);
		return { element };
	}

	constructor(tagName: string, key?: NodeKey) {
		super(key);
		this.__tagName = tagName;
	}

	exportJSON(): SerializedFormattingNode {
		return {
			...super.exportJSON(),
			type: this.getType(),
			tag: this.getTagName(),
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
