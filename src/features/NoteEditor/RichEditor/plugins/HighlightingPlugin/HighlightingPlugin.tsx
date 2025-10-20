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
		similarity: 0.5,
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

		// Find search query immediately
		requestAnimationFrame(() => {
			editor.read(() => {
				const root = $getRoot();
				const textNodes = root.getAllTextNodes();

				const newRanges: Record<string, Range[]> = {};
				for (const node of textNodes) {
					newRanges[node.getKey()] = $getTextNodeHighlights(node, search);
				}

				setHighlights((state) => ({ ...state, ...newRanges }));
			});
		});

		const unsubscribe = mergeRegister(
			registerMutationObserver(editor, () => {
				// Redraw markers, since position may be updated
				setHighlights((state) => ({ ...state }));
			}),
			editor.registerMutationListener(TextNode, (mutations) => {
				editor.read(() => {
					const newRanges: Record<string, Range[]> = {};
					for (const [key, mutation] of mutations) {
						// Delete node
						if (mutation === 'destroyed') {
							setHighlights((state) => {
								if (key in state) {
									const newState = { ...state };
									delete newState[key];
									return newState;
								}

								return state;
							});

							return;
						}

						const node = $getNodeByKey(key);
						if (node) {
							newRanges[key] = $getTextNodeHighlights(node, search);
						}
					}

					setHighlights((state) => ({ ...state, ...newRanges }));
				});
			}),
		);

		return () => {
			unsubscribe();
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
