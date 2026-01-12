import React, { Ref, useEffect } from 'react';
import { LexicalEditor } from 'lexical';
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
import { useAppSelector } from '@state/redux/hooks';
import { selectEditorConfig } from '@state/redux/settings/selectors/preferences';
import { setRef } from '@utils/react/setRef';

import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { GenericContextMenu } from './plugins/ContextMenu/components/GenericContextMenu';
import { ContextMenuPlugin } from './plugins/ContextMenu/ContextMenuPlugin';
import { EditorPanelPlugin } from './plugins/EditorPanelPlugin/EditorPanelPlugin';
import { DropFilesPlugin } from './plugins/Files/DropFilesPlugin';
import { FilesPlugin } from './plugins/Files/FilesPlugin';
import { FormattingPlugin } from './plugins/Formatting/FormattingPlugin';
import { HighlightingPlugin } from './plugins/HighlightingPlugin/HighlightingPlugin';
import ImagesPlugin from './plugins/Image/ImagesPlugin';
import { LinkClickHandlerPlugin } from './plugins/LinkClickHandlerPlugin';
import {
	MarkdownSerializePlugin,
	MarkdownSerializePluginProps,
} from './plugins/Markdown/MarkdownSerializePlugin';
import { MarkdownShortcutPlugin } from './plugins/Markdown/MarkdownShortcutPlugin';
import { ReadOnlyPlugin } from './plugins/ReadOnlyPlugin';

export type RichEditorContentProps = BoxProps &
	MarkdownSerializePluginProps & {
		placeholder?: string;
		isReadOnly?: boolean;
		search?: string;
		lexicalRef?: Ref<LexicalEditor>;
	};

export const RichEditorContent = ({
	value,
	onChanged,
	placeholder,
	isReadOnly,
	search,
	lexicalRef,
	...props
}: RichEditorContentProps) => {
	const styles = useMultiStyleConfig('RichEditor');
	const editorConfig = useAppSelector(selectEditorConfig);

	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		if (!lexicalRef || !editor) return;
		return setRef(lexicalRef ?? null, editor);
	}, [editor, lexicalRef]);

	return (
		<Box
			position="relative"
			display="flex"
			width="100%"
			height="100%"
			overflow="auto"
			sx={{
				...styles.root,
				// TODO: move a styles to a top level container
				fontSize: editorConfig.fontSize,
				fontFamily: editorConfig.fontFamily,
				lineHeight: editorConfig.lineHeight,
			}}
		>
			<ContextMenuPlugin renderer={GenericContextMenu} />

			<RichTextPlugin
				contentEditable={
					<Box
						w="100%"
						maxH="100%"
						outline="none"
						paddingInline="0.5rem"
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
							paddingInline="0.5rem"
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

			<HighlightingPlugin search={search} />

			<ReadOnlyPlugin readonly={isReadOnly ?? false} />
		</Box>
	);
};
