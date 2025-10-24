/* eslint-disable spellcheck/spell-checker */
import React, { useEffect, useState } from 'react';
import { $getEditor, $getNodeByKey, $getRoot, LexicalNode, TextNode } from 'lexical';
import { Box } from '@chakra-ui/react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { findTextSegments } from '@utils/text/search';

import { registerMutationObserver } from '../../utils/registerMutationObserver';

const $getTextNodeHighlights = (node: LexicalNode, search: string) => {
	const text = node.getTextContent();
	const segments = findTextSegments(text, search, {
		// TODO: value is inverted. Fix it. Make 0 is not similar, 1 is completely similar
		similarity: 0.2,
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

// TODO: update position by any changes in DOM
export const HighlightingPlugin = ({ search }: { search?: string }) => {
	const [highlights, setHighlights] = useState<Record<string, Range[]>>({});

	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		if (!search) return;

		const elementToKeyMap = new Map<Element, string>();

		// Render highlights only for nodes in viewport
		const observer = new IntersectionObserver((entries) => {
			const keysToRemove: string[] = [];
			const keysToAdd: string[] = [];

			for (const entry of entries) {
				const key = elementToKeyMap.get(entry.target);
				if (!key) continue;

				// Remove
				if (!entry.isIntersecting) {
					keysToRemove.push(key);
					continue;
				}

				// Add
				keysToAdd.push(key);
			}

			// Apply changes
			setHighlights((state) => {
				return editor.read(() => {
					const newState = { ...state };

					// Delete
					keysToRemove.forEach((key) => delete newState[key]);

					// Add
					for (const key of keysToAdd) {
						const node = $getNodeByKey(key);
						if (node) {
							newState[key] = $getTextNodeHighlights(node, search);
						}
					}

					return newState;
				});
			});
		});

		// Observe intersections on all text nodes
		requestAnimationFrame(() => {
			editor.read(() => {
				const root = $getRoot();
				const textNodes = root.getAllTextNodes();

				for (const node of textNodes) {
					const key = node.getKey();
					const element = editor.getElementByKey(key);

					if (element) {
						elementToKeyMap.set(element, key);
						observer.observe(element);
					}
				}
			});
		});

		const unsubscribe = mergeRegister(
			registerMutationObserver(editor, () => {
				// Redraw markers, since position may be updated
				setHighlights((state) => ({ ...state }));
			}),
			editor.registerMutationListener(TextNode, (mutations) => {
				editor.read(() => {
					const keysToRemove: string[] = [];
					for (const [key, mutation] of mutations) {
						// Delete highlighting
						if (mutation === 'destroyed') {
							// TODO: unobserve elements
							keysToRemove.push(key);
						}

						// Track intersections
						const element = editor.getElementByKey(key);
						if (element) {
							elementToKeyMap.set(element, key);
							observer.unobserve(element);
							observer.observe(element);
						}
					}

					// Apply changes
					setHighlights((state) => {
						return editor.read(() => {
							const newState = { ...state };

							// Delete
							keysToRemove.forEach((key) => delete newState[key]);

							return newState;
						});
					});
				});
			}),
		);

		return () => {
			unsubscribe();
			setHighlights({});
			elementToKeyMap.clear();
			observer.disconnect();
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
								backgroundColor="yellow"
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
