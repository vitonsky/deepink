import { useEffect } from 'react';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$getSelection,
	$hasAncestor,
	$isBlockElementNode,
	$isRangeSelection,
	CONTROLLED_TEXT_INSERTION_COMMAND,
	ElementNode,
	LexicalNode,
} from 'lexical';
import { $createCodeNode } from '@lexical/code';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createQuoteNode } from '@lexical/rich-text';
import { $findMatchingParent } from '@lexical/utils';

import { InsertingPayloadMap, useEditorPanelContext } from '../../EditorPanel';

export const $wrapNodes = (createElement: (nodes: LexicalNode[]) => ElementNode) => {
	const selection = $getSelection();

	const points = selection?.getStartEndPoints();
	if (!selection || !points) return;

	const [start, end] = points;

	if (
		$isRangeSelection(selection) &&
		(start.getNode() !== end.getNode() || start.offset !== end.offset)
	) {
		const selectedNodes = selection.getNodes();
		const anchorNode = selection.anchor.getNode();
		const commonAncestor =
			$findMatchingParent(anchorNode, (parent) =>
				selectedNodes.every((selectedNode) => $hasAncestor(selectedNode, parent)),
			) ?? $getRoot();
		if (!commonAncestor || !$isBlockElementNode(commonAncestor)) return;

		const firstChildNode = commonAncestor
			.getChildren()
			.find((children) => selectedNodes.includes(children));
		console.log('firstChildNode', firstChildNode);
		if (!firstChildNode) return;

		const tmpNode = $createParagraphNode();
		firstChildNode.insertBefore(tmpNode);

		const topSelectedNodes = selectedNodes.filter((node) =>
			commonAncestor.is(node.getParent()),
		);

		console.warn('FINAL STEP', {
			commonAncestor,
			topSelectedNodes,
			selectedNodes,
			parents: selectedNodes.map((node) => node.getParent()),
		});
		tmpNode.replace(createElement(topSelectedNodes));

		return;
	}

	const blockElement = $findMatchingParent(
		start.getNode(),
		(node) => $isBlockElementNode(node) && !node.isParentRequired(),
	) as ElementNode | null;

	if (!blockElement) return;

	const tmpNode = $createParagraphNode();
	blockElement.replace(tmpNode);
	tmpNode.replace(createElement([blockElement]));
};

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

							const p = $createParagraphNode();
							p.append(...nodes);
							const textContent = p.getTextContent();
							p.remove();

							code.append($createTextNode(textContent));
							code.select();

							return code;
						});
					});
				},
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
