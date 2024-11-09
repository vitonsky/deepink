/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable spellcheck/spell-checker */

import * as React from 'react';
import { Suspense } from 'react';
import {
	$applyNodeReplacement,
	DecoratorNode,
	DOMConversionMap,
	DOMConversionOutput,
	DOMExportOutput,
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from 'lexical';

export interface RawTextPayload {
	content: string;
	key?: NodeKey;
}

export type SerializedRawTextNode = Spread<
	{
		content: string;
	},
	SerializedLexicalNode
>;

function $convertPreElement(domNode: Node): null | DOMConversionOutput {
	if (!(domNode instanceof HTMLPreElement)) {
		return null;
	}
	const node = $createRawTextNode({ content: domNode.innerText });
	return { node };
}

export class RawTextNode extends DecoratorNode<JSX.Element> {
	__content: string;

	static getType(): string {
		return 'raw-text';
	}

	static clone(node: RawTextNode): RawTextNode {
		return new RawTextNode(node.__content, node.__key);
	}

	static importJSON(serializedNode: SerializedRawTextNode): RawTextNode {
		const { content } = serializedNode;
		return $createRawTextNode({ content });
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement('pre');
		element.innerText = this.__content;
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

	constructor(content: string, key?: NodeKey) {
		super(key);
		this.__content = content;
	}

	exportJSON(): SerializedRawTextNode {
		return {
			type: this.getType(),
			version: 1,
			content: this.getTextContent(),
		};
	}

	// View

	createDOM(config: EditorConfig): HTMLElement {
		const span = document.createElement('span');
		const theme = config.theme;
		const className = theme.embedBlock?.base;
		if (className !== undefined) {
			span.className = className;
		}
		return span;
	}

	updateDOM(): false {
		return false;
	}

	getTextContent(): string {
		return this.__content;
	}

	setTextContent(content: string) {
		const writable = this.getWritable();
		writable.__content = content;
	}

	decorate(): JSX.Element {
		return (
			<Suspense fallback={null}>
				<pre>{this.__content}</pre>
			</Suspense>
		);
	}
}

export function $createRawTextNode({ content, key }: RawTextPayload): RawTextNode {
	return $applyNodeReplacement(new RawTextNode(content, key));
}

export function $isRawTextNode(
	node: LexicalNode | null | undefined,
): node is RawTextNode {
	return node instanceof RawTextNode;
}
