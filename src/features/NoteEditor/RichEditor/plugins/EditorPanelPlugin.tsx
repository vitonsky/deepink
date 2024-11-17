import { useEffect } from 'react';
import {
	$createParagraphNode,
	$getSelection,
	$isBlockElementNode,
	$isRangeSelection,
	CONTROLLED_TEXT_INSERTION_COMMAND,
	ElementNode,
} from 'lexical';
import {} from '@lexical/code';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createQuoteNode } from '@lexical/rich-text';
import { $wrapNodes } from '@lexical/selection';
import { $findMatchingParent, $wrapNodeInElement } from '@lexical/utils';

import { InsertingPayloadMap, useEditorPanelContext } from '../../EditorPanel';

// TODO: implement all inserting & formatting features
export const EditorPanelPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const { onInserting } = useEditorPanelContext();

	useEffect(() => {
		return onInserting.watch((evt) => {
			console.warn('INSERTING ELEMENT', evt);

			const commands: {
				[K in keyof InsertingPayloadMap]?: (
					payload: InsertingPayloadMap[K],
				) => void;
			} = {
				horizontalRule() {
					editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
				},
				date({ date }) {
					editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, date);
				},
				quote() {
					editor.update(() => {
						const selection = $getSelection();

						const points = selection?.getStartEndPoints();
						if (!selection || !points) return;

						const [start, end] = points;

						if (
							$isRangeSelection(selection) &&
							(start.getNode() !== end.getNode() ||
								start.offset !== end.offset)
						) {
							$wrapNodes(
								selection,
								$createParagraphNode,
								$createQuoteNode(),
							);
							return;
						}

						const blockElement = $findMatchingParent(
							start.getNode(),
							(node) =>
								$isBlockElementNode(node) && !node.isParentRequired(),
						) as ElementNode | null;
						if (!blockElement) return;

						$wrapNodeInElement(blockElement, $createQuoteNode);
					});
				},
				// code({ text }) {
				// 	editor.dispatchCommand();
				// },
				link({ url }) {
					editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url });
				},
				// image({ url }) {
				// 	editor.dispatchCommand(INSERT_IMAGE_COMMAND, { });
				// },
				list({ type }) {
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
			};

			const command = commands[evt.type];
			if (command) {
				// @ts-ignore
				command(evt.data);
			}
		});
	}, [editor, onInserting]);

	return null;
};
