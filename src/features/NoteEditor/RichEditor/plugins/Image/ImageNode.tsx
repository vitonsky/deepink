/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable spellcheck/spell-checker */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import { JSX, Suspense } from 'react';
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

const ImageComponent = React.lazy(() => import('./ImageComponent'));

export interface ImagePayload {
	src: string;
	altText: string;
	width?: number;
	height?: number;
	maxWidth?: number;
	key?: NodeKey;
}

function isGoogleDocCheckboxImg(img: HTMLImageElement): boolean {
	return (
		img.parentElement != null &&
		img.parentElement.tagName === 'LI' &&
		img.previousSibling === null &&
		img.getAttribute('aria-roledescription') === 'checkbox'
	);
}

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
	const img = domNode as HTMLImageElement;
	if (img.src.startsWith('file:///') || isGoogleDocCheckboxImg(img)) {
		return null;
	}
	const { alt: altText, src, width, height } = img;
	const node = $createImageNode({ altText, height, src, width });
	return { node };
}

export type SerializedImageNode = Spread<
	{
		src: string;
		altText: string;
		width?: number;
		height?: number;
		maxWidth?: number;
	},
	SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
	__src: string;
	__altText: string;
	__width: 'inherit' | number;
	__height: 'inherit' | number;
	__maxWidth?: number;

	static getType(): string {
		return 'image';
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(
			node.__src,
			node.__altText,
			node.__maxWidth,
			node.__width,
			node.__height,
			node.__key,
		);
	}

	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		const { altText, height, width, maxWidth, src } = serializedNode;
		return $createImageNode({
			altText,
			height,
			maxWidth,
			src,
			width,
		});
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement('img');
		element.setAttribute('src', this.__src);
		element.setAttribute('alt', this.__altText);
		element.setAttribute('width', this.__width.toString());
		element.setAttribute('height', this.__height.toString());
		return { element };
	}

	static importDOM(): DOMConversionMap | null {
		return {
			img: (_node: Node) => ({
				conversion: $convertImageElement,
				priority: 0,
			}),
		};
	}

	constructor(
		src: string,
		altText: string,
		maxWidth?: number,
		width?: 'inherit' | number,
		height?: 'inherit' | number,
		key?: NodeKey,
	) {
		super(key);
		this.__src = src;
		this.__altText = altText;
		this.__maxWidth = maxWidth;
		this.__width = width || 'inherit';
		this.__height = height || 'inherit';
	}

	exportJSON(): SerializedImageNode {
		return {
			type: 'image',
			version: 1,
			src: this.getSrc(),
			altText: this.getAltText(),
			width: this.__width === 'inherit' ? 0 : this.__width,
			height: this.__height === 'inherit' ? 0 : this.__height,
			maxWidth: this.__maxWidth,
		};
	}

	setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
		const writable = this.getWritable();
		writable.__width = width;
		writable.__height = height;
	}

	// View

	createDOM(config: EditorConfig): HTMLElement {
		const span = document.createElement('span');
		const theme = config.theme;
		const className = theme.image;
		if (className !== undefined) {
			span.className = className;
		}
		return span;
	}

	updateDOM(): false {
		return false;
	}

	getSrc(): string {
		return this.__src;
	}

	setSrc(src: string) {
		const writable = this.getWritable();
		writable.__src = src;
	}

	getAltText(): string {
		return this.__altText;
	}

	setAltText(alt: string) {
		const writable = this.getWritable();
		writable.__altText = alt;
	}

	decorate(): JSX.Element {
		return (
			<Suspense fallback={null}>
				<ImageComponent
					src={this.__src}
					altText={this.__altText}
					width={this.__width}
					height={this.__height}
					maxWidth={this.__maxWidth}
					nodeKey={this.getKey()}
				/>
			</Suspense>
		);
	}
}

export function $createImageNode({
	altText,
	height,
	maxWidth,
	src,
	width,
	key,
}: ImagePayload): ImageNode {
	return $applyNodeReplacement(
		new ImageNode(src, altText, maxWidth, width, height, key),
	);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
	return node instanceof ImageNode;
}
