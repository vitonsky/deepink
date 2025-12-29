import { useEffect } from 'react';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$getSelection,
	$isBlockElementNode,
	$isParagraphNode,
	$isRootNode,
	$isTextNode,
	CONTROLLED_TEXT_INSERTION_COMMAND,
} from 'lexical';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $dfs } from '@lexical/utils';

import { InsertingPayloadMap, useEditorPanelContext } from '../../../EditorPanel';
import { $getCursorNode } from '../../utils/selection';

import { INSERT_FILES_COMMAND } from '../Files/FilesPlugin';
import { $createImageNode } from '../Image/ImageNode';
import { $toggleFormatNode } from './utils/format';
import {
	$canInsertElementsToNode,
	$findCommonAncestor,
	$getNearestSibling,
	$wrapNodes,
} from './utils/tree';

/**
 * Plugin to handle editor panel actions about formatting and nodes insertion
 */
export const EditorPanelPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const { onInserting, onFormatting } = useEditorPanelContext();

	useEffect(() => {
		const cleanupFormatting = onFormatting.watch((format) => {
			// TODO: support formatting selected text slices
			editor.update(() => {
				const selection = $getSelection();
				if (!selection) return;

				const nodes = selection.getNodes();
				if (nodes.length === 0) return;

				const commonAncestor = $findCommonAncestor(nodes[0], nodes, (node) =>
					$dfs(node).some(({ node }) => $isCodeNode(node)),
				);
				if (!commonAncestor) return;

				$toggleFormatNode(commonAncestor, format);
			});
		});

		const cleanupInserting = onInserting.watch((evt) => {
			const commands: {
				[K in keyof InsertingPayloadMap]?: (
					payload: InsertingPayloadMap[K],
				) => void;
			} = {
				heading({ level }) {
					editor.update(() => {
						const target = $getCursorNode();
						if (!target) return;

						const parent = target.getParent();
						if (parent && !$canInsertElementsToNode(parent)) return;

						if ($isHeadingNode(parent)) {
							const headerLevel = Number(parent.getTag().slice(1));
							if (headerLevel === level) {
								$setBlocksType($getSelection(), () =>
									$createParagraphNode(),
								);
							} else {
								$setBlocksType($getSelection(), () =>
									$createHeadingNode(`h${level}`),
								);
							}
							return;
						}

						// Insert
						const heading = $createHeadingNode(`h${level}`);
						if ($isTextNode(target)) {
							target.replace(heading);
							heading.append(target);
							heading.select();
						} else {
							// Insert at root
							if (!parent) {
								$getRoot().append(heading);
								heading.select();
								return;
							}

							// Insert before
							target.insertBefore(heading);
							heading.select();
						}
					});
				},
				list({ type }) {
					editor.update(() => {
						const target = $getCursorNode();
						if (!target) return;

						if ($isRootNode(target)) {
							const paragraph = $createParagraphNode();
							target.append(paragraph);
							paragraph.select();
						}
					});

					switch (type) {
						case 'checkbox':
							editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
							break;
						case 'ordered':
							editor.dispatchCommand(
								INSERT_ORDERED_LIST_COMMAND,
								undefined,
							);
							break;
						case 'unordered':
							editor.dispatchCommand(
								INSERT_UNORDERED_LIST_COMMAND,
								undefined,
							);
							break;
					}
				},
				link({ url }) {
					editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url });
				},
				image({ url, altText }) {
					editor.update(() => {
						const cursorNode = $getCursorNode();
						if (!cursorNode) return;

						const anchorNode = $getNearestSibling(cursorNode);
						if (!anchorNode) return;

						const imageNode = $createImageNode({ src: url, altText });
						if ($isBlockElementNode(anchorNode)) {
							const paragraphNode = $createParagraphNode();
							paragraphNode.append(imageNode);

							if ($isRootNode(anchorNode)) {
								anchorNode.append(paragraphNode);
							} else {
								anchorNode.insertAfter(paragraphNode);
							}
						} else {
							anchorNode.insertAfter(imageNode);
						}
					});
				},
				quote() {
					editor.update(() => {
						$wrapNodes((nodes) => {
							const quote = $createQuoteNode();

							if (nodes.length === 0) {
								const paragraph = $createParagraphNode();
								quote.append(paragraph);
								paragraph.select();
							} else {
								quote.append(
									...nodes.map((node) => {
										if ($isParagraphNode(node)) return node;

										const paragraph = $createParagraphNode();
										paragraph.append(node);
										return paragraph;
									}),
								);
							}

							return quote;
						});
					});
				},
				code() {
					editor.update(() => {
						$wrapNodes((nodes) => {
							const code = $createCodeNode();

							const textContent = nodes
								.map(
									(node, index) =>
										($isBlockElementNode(node) && index > 0
											? '\n'
											: '') + node.getTextContent(),
								)
								.join('');
							nodes.forEach((node) => node.remove());

							code.append($createTextNode(textContent));
							code.select();

							return code;
						});
					});
				},
				horizontalRule() {
					editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
				},
				date({ date }) {
					editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, date);
				},
				file(payload) {
					editor.dispatchCommand(INSERT_FILES_COMMAND, {
						files: payload.files,
					});
				},
			};

			const command = commands[evt.type];
			if (command) {
				// Data depends on type, so it always will match
				// @ts-ignore
				command(evt.data);
			}
		});

		return () => {
			cleanupFormatting();
			cleanupInserting();
		};
	}, [editor, onFormatting, onInserting]);

	return null;
};
