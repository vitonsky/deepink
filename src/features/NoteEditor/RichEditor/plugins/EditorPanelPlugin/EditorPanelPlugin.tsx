import { useEffect } from 'react';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$getSelection,
	$isBlockElementNode,
	$isRangeSelection,
	$isRootNode,
	$isTextNode,
	CONTROLLED_TEXT_INSERTION_COMMAND,
	LexicalNode,
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
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $dfs } from '@lexical/utils';

import { InsertingPayloadMap, useEditorPanelContext } from '../../../EditorPanel';
import { $getCursorNode } from '../../utils/selection';

import { INSERT_FILES_COMMAND } from '../Files/FilesPlugin';
import { $createImageNode } from '../Image/ImageNode';
import { $toggleFormatNode } from './utils/format';
import {
	$canInsertElementsToNode,
	$findCommonAncestor,
	$wrapNodes,
} from './utils/insertion';

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
				horizontalRule() {
					editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
				},
				date({ date }) {
					editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, date);
				},
				quote() {
					editor.update(() => {
						$wrapNodes((nodes) => {
							const quote = $createQuoteNode();
							quote.append(...nodes);
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
									(node) =>
										node.getTextContent() +
										($isBlockElementNode(node) ? '\n' : ''),
								)
								.join('');
							nodes.forEach((node) => node.remove());

							code.append($createTextNode(textContent));
							code.select();

							return code;
						});
					});
				},
				link({ url }) {
					editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url });
				},
				image({ url, altText }) {
					editor.update(() => {
						const selection = $getSelection();
						if (!selection) return;

						const anchorNode = $isRangeSelection(selection)
							? selection.anchor.getNode()
							: selection.getNodes()[0];

						let targetNode: LexicalNode | null = anchorNode;
						const parent = targetNode.getParent();
						if (parent && !$canInsertElementsToNode(parent)) {
							const parents = targetNode.getParents();
							targetNode = null;

							for (let i = parents.length - 2; i > 0; i++) {
								const target = parents[i + 1];
								const parent = parents[i];

								if (!$canInsertElementsToNode(parent)) continue;
								targetNode = target;
							}

							if (!targetNode) return;
						}

						const imageNode = $createImageNode({ src: url, altText });
						if ($isBlockElementNode(targetNode)) {
							const paragraphNode = $createParagraphNode();
							paragraphNode.append(imageNode);
							targetNode.insertAfter(paragraphNode);
						} else {
							targetNode.insertAfter(imageNode);
						}
					});
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
