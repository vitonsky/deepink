import React, { useEffect, useState } from 'react';
import {
	$getEditor,
	$getNearestNodeFromDOMNode,
	$getRoot,
	LexicalNode,
	TextNode,
} from 'lexical';
import { Box } from '@chakra-ui/react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { debounce } from '@utils/debounce/debounce';
import { findTextSegments } from '@utils/text/findTextSegments';

import { registerMutationObserver } from '../../utils/registerMutationObserver';

const $getTextNodeHighlights = (node: LexicalNode, search: string) => {
	const text = node.getTextContent();
	const segments = findTextSegments(text, search, {
		similarity: 0.7,
	});

	if (segments.length === 0) return [];

	const textNode = $getEditor().getElementByKey(node.getKey())?.firstChild;
	if (!textNode) return [];

	const ranges: Range[] = [];
	for (const segment of segments) {
		const range = new Range();
		range.setStart(textNode, segment.start);
		range.setEnd(textNode, segment.end);

		ranges.push(range);
	}

	return ranges;
};

// TODO: decorate original text nodes instead of draw boxes over
export const HighlightingPlugin = ({ search }: { search?: string }) => {
	const [highlights, setHighlights] = useState<Record<string, Range[]>>({});

	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		if (!search) return;

		// Render visible elements
		const visibleElements = new Set<Element>();
		const clearHighlights = () =>
			setHighlights((state) => (Object.keys(state).length === 0 ? state : {}));
		const updateHighlights = debounce(
			() => {
				editor.read(() => {
					const newState: Record<string, Range[]> = {};

					for (const element of visibleElements) {
						const node = $getNearestNodeFromDOMNode(element);
						if (node) {
							const key = node.getKey();
							newState[key] = $getTextNodeHighlights(node, search);
						}
					}

					setHighlights(newState);
				});
			},
			{ wait: 100 },
		);

		// Render highlights only for nodes in viewport
		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					visibleElements.add(entry.target);
				} else {
					visibleElements.delete(entry.target);
				}
			}

			updateHighlights();
		});

		const observedNodes = new Map<string, Element>();
		const observe = (key: string, node: Element) => {
			const prevNode = observedNodes.get(key);
			if (prevNode && prevNode !== node) {
				observer.unobserve(prevNode);
				visibleElements.delete(prevNode);
			}

			observedNodes.set(key, node);
			observer.observe(node);
		};

		const unobserve = (key: string) => {
			const node = observedNodes.get(key);
			if (node) {
				observer.unobserve(node);
				visibleElements.delete(node);
				observedNodes.delete(key);
			}
		};

		// Observe intersections on all text nodes
		requestAnimationFrame(() => {
			editor.read(() => {
				const root = $getRoot();
				const textNodes = root.getAllTextNodes();

				for (const node of textNodes) {
					const key = node.getKey();
					const element = editor.getElementByKey(key);

					if (element) {
						observe(key, element);
					}
				}
			});
		});

		const unsubscribe = mergeRegister(
			// Redraw markers, since position may be updated
			registerMutationObserver(editor, () => {
				clearHighlights();
				updateHighlights();
			}),
			editor.registerMutationListener(TextNode, (mutations) => {
				editor.read(() => {
					for (const [key, mutation] of mutations) {
						// Delete highlighting
						if (mutation === 'destroyed') {
							unobserve(key);
							continue;
						}

						// Track intersections
						const element = editor.getElementByKey(key);
						if (element) {
							observe(key, element);
						}
					}
				});

				updateHighlights();
			}),
		);

		return () => {
			unsubscribe();
			observer.disconnect();
			observedNodes.clear();

			updateHighlights.cancel();
			setHighlights({});
		};
	}, [editor, search]);

	const rootRect = editor.getRootElement()?.getClientRects()?.item(0);

	if (!rootRect) return null;

	return Object.entries(highlights)
		.map(([key, ranges]) =>
			ranges
				.map((range, index) =>
					Array.from(range.getClientRects()).map(
						({ x, y, width, height }, rectIndex) => (
							<Box
								key={`${key}-${index}-${rectIndex}`}
								position="absolute"
								pointerEvents="none"
								opacity=".4"
								transform="scale(1.1)"
								backgroundColor="highlight.background"
								color="highlight.foreground"
								blendMode="multiply"
								style={{
									left: `${x - rootRect.x}px`,
									top: `${y - rootRect.y}px`,
									width: `${width}px`,
									height: `${height}px`,
								}}
							/>
						),
					),
				)
				.flat(),
		)
		.flat();
};
