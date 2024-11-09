/* eslint-disable spellcheck/spell-checker */
import React, { useEffect, useRef } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HashtagNode } from '@lexical/hashtag';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { CHECK_LIST, LINK, TRANSFORMERS } from '@lexical/markdown';
import { OverflowNode } from '@lexical/overflow';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';

import { ImageNode } from './nodes/ImageNode';
import { RawTextNode } from './nodes/RawTextNode';
import theme from './PlaygroundEditorTheme';
import ImagesPlugin from './plugins/ImagesPlugin';
import { MarkdownChecklistShortcutPlugin } from './plugins/MarkdownChecklistShortcutPlugin';
import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
} from './plugins/markdownParser';

export type RichEditorProps = BoxProps & {
	value: string;
	onValueChanged?: (value: string) => void;
};

const customTransformers = [LINK, CHECK_LIST, ...TRANSFORMERS];

export const RichEditorContent = ({
	value,
	onValueChanged,
	...props
}: RichEditorProps) => {
	const [editor] = useLexicalComposerContext();

	const valueRef = useRef<string | null>(null);
	useEffect(() => {
		// Skip updates that has been sent from this component
		if (valueRef.current === value) return;

		editor.update(() => {
			$convertFromMarkdownString(value);
		});

		(window as any)['update'] = (text: string) => {
			editor.update(() => {
				$convertFromMarkdownString(text);
			});
		};
	}, [editor, value]);

	const onChange = (value: string) => {
		valueRef.current = value;

		if (onValueChanged) {
			onValueChanged(value);
		}
	};

	return (
		<Box position="relative" display="flex" width="100%" height="100%">
			<RichTextPlugin
				contentEditable={
					<Box
						w="100%"
						maxH="100%"
						overflow="auto"
						padding="1rem"
						{...props}
						as={ContentEditable}
					/>
				}
				placeholder={
					<Box
						position="absolute"
						top={0}
						left={0}
						right={0}
						bottom={0}
						padding="1rem"
						pointerEvents="none"
					>
						Enter some text...
					</Box>
				}
				ErrorBoundary={LexicalErrorBoundary}
			/>
			<MarkdownShortcutPlugin transformers={customTransformers} />
			<HistoryPlugin />
			<AutoFocusPlugin />
			<ListPlugin />
			<CheckListPlugin />
			<TabIndentationPlugin />
			<LinkPlugin />
			<ImagesPlugin />

			<ClearEditorPlugin />
			<ClickableLinkPlugin />
			<HashtagPlugin />
			<HorizontalRulePlugin />
			<TablePlugin />
			<OnChangePlugin
				onChange={(_, editor) => {
					editor.update(() => {
						onChange($convertToMarkdownString());
					});
				}}
			/>
			<MarkdownChecklistShortcutPlugin />
		</Box>
	);
};

// TODO: make links editable
// TODO: support attachments
// TODO: move lines with alt+arrows
// TODO: support images
// TODO: support videos
// TODO: improve styles
// TODO: copy markdown text by selection, not rich text
// TODO: when user start remove markdown element - transform it to markdown and remove single char instead
// TODO: add context menu for block elements, to toggle list types
export const RichEditor = (props: RichEditorProps) => {
	return (
		<LexicalComposer
			initialConfig={{
				namespace: 'RichEditor',
				theme,
				editorState: (editor) => {
					editor.registerUpdateListener(() => {
						console.warn('Updated state', editor.getEditorState().toJSON());
					});
					// editor.update(() => {
					// 	$convertFromMarkdownString(
					// 		'Hello **world**! \n* [x] Unchecked item\n\n Hello again',
					// 		TRANSFORMERS,
					// 	);
					// });
				},
				nodes: [
					RawTextNode,
					ImageNode,
					LinkNode,
					AutoLinkNode,
					ListNode,
					ListItemNode,
					TableNode,
					TableCellNode,
					TableRowNode,
					HorizontalRuleNode,
					CodeNode,
					HeadingNode,
					LinkNode,
					ListNode,
					ListItemNode,
					QuoteNode,
					CodeHighlightNode,
					HashtagNode,
					MarkNode,
					OverflowNode,
				],
				onError(error) {
					// Catch any errors that occur during Lexical updates and log them
					// or throw them as needed. If you don't throw them, Lexical will
					// try to recover gracefully without losing user data.
					console.error(error);
				},
			}}
		>
			<RichEditorContent {...props} />
		</LexicalComposer>
	);
};
