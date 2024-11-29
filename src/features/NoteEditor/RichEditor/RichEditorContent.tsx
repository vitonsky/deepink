import React, { useEffect, useRef } from 'react';
import { Box, BoxProps, useMultiStyleConfig } from '@chakra-ui/react';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';

import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { GenericContextMenu } from './plugins/ContextMenu/components/GenericContextMenu';
import { ContextMenuPlugin } from './plugins/ContextMenu/ContextMenuPlugin';
import { EditorPanelPlugin } from './plugins/EditorPanelPlugin/EditorPanelPlugin';
import { DropFilesPlugin } from './plugins/Files/DropFilesPlugin';
import { FilesPlugin } from './plugins/Files/FilesPlugin';
import { FormattingPlugin } from './plugins/Formatting/FormattingPlugin';
import ImagesPlugin from './plugins/Image/ImagesPlugin';
import { LinkClickHandlerPlugin } from './plugins/LinkClickHandlerPlugin';
import {
	MarkdownSerializePlugin,
	MarkdownSerializePluginProps,
} from './plugins/Markdown/MarkdownSerializePlugin';
import { MarkdownShortcutPlugin } from './plugins/Markdown/MarkdownShortcutPlugin';

export type RichEditorContentProps = BoxProps &
	MarkdownSerializePluginProps & {
		placeholder?: string;
	};

export const RichEditorContent = ({
	value,
	onChanged,
	placeholder,
	...props
}: RichEditorContentProps) => {
	const [editor] = useLexicalComposerContext();
	const styles = useMultiStyleConfig('RichEditor');

	const containerRef = useRef<HTMLDivElement | null>(null);
	const isActive = () => {
		const container = containerRef.current;
		if (!container || !document.activeElement) return false;
		if (
			container !== document.activeElement &&
			!container.contains(document.activeElement)
		)
			return false;

		return true;
	};

	// toggle `editable` based on focus
	useEffect(() => {
		const onFocus = () => {
			const editable = isActive();
			console.log('Change editable state', editable);
			editor.setEditable(editable);
		};

		document.addEventListener('focusin', onFocus);
		return () => {
			document.removeEventListener('focusin', onFocus);
		};
	}, [editor]);

	return (
		<Box
			position="relative"
			display="flex"
			width="100%"
			height="100%"
			overflow="hidden"
			sx={styles.root}
		>
			<ContextMenuPlugin renderer={GenericContextMenu} />

			<RichTextPlugin
				contentEditable={
					<Box
						ref={containerRef}
						w="100%"
						maxH="100%"
						overflow="auto"
						padding="1rem"
						onMouseDown={() => {
							editor.setEditable(true);
						}}
						{...props}
						as={ContentEditable}
					/>
				}
				placeholder={
					placeholder ? (
						<Box
							position="absolute"
							top={0}
							left={0}
							right={0}
							bottom={0}
							padding="1rem"
							pointerEvents="none"
						>
							{placeholder}
						</Box>
					) : undefined
				}
				ErrorBoundary={LexicalErrorBoundary}
			/>
			<MarkdownSerializePlugin value={value} onChanged={onChanged} />
			<MarkdownShortcutPlugin />
			<FormattingPlugin />

			<ImagesPlugin />
			<CodeHighlightPlugin />
			<LinkPlugin />
			<LinkClickHandlerPlugin />

			<FilesPlugin />
			<DropFilesPlugin />
			<EditorPanelPlugin />

			<HistoryPlugin />
			<TabIndentationPlugin />

			<ListPlugin />
			<CheckListPlugin />
			<TablePlugin />
			<HorizontalRulePlugin />
		</Box>
	);
};
