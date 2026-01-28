import React, { memo } from 'react';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { OverflowNode } from '@lexical/overflow';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';

import { ImageNode } from './plugins/Image/ImageNode';
import { FormattingNode } from './plugins/Markdown/nodes/FormattingNode';
import { RawNode } from './plugins/Markdown/nodes/RawNode';
import { RichEditorContent, RichEditorContentProps } from './RichEditorContent';
import { theme } from './theme/RichEditor';

// TODO: move lines with alt+arrows
// TODO: support videos
// TODO: copy markdown text by selection, not rich text
// TODO: when user start remove markdown element - transform it to markdown and remove single char instead
export const RichEditor = memo((props: RichEditorContentProps) => {
	return (
		<LexicalComposer
			initialConfig={{
				namespace: 'RichEditor',
				theme,
				editable: !props.isReadOnly,
				nodes: [
					// App specific nodes
					RawNode,
					FormattingNode,
					ImageNode,

					// Plugins
					LinkNode,
					AutoLinkNode,
					ListNode,
					ListItemNode,
					TableNode,
					TableCellNode,
					TableRowNode,
					HorizontalRuleNode,
					HeadingNode,
					QuoteNode,
					CodeNode,
					CodeHighlightNode,
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
});

RichEditor.displayName = 'RichEditor';
