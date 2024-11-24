import React, { useEffect, useRef } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';

import { ContextMenu } from './ContextMenu/ContextMenu';
import { GenericContextMenu } from './ContextMenu/GenericContextMenu';
import { AppLinks } from './plugins/AppLinks';
import { DropFilesPlugin } from './plugins/DropFilesPlugin';
import { EditorPanelPlugin } from './plugins/EditorPanelPlugin';
import { FormattingPlugin } from './plugins/FormattingPlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
} from './plugins/markdownParser';
import { MarkdownShortcutPlugin } from './plugins/MarkdownShortcutPlugin';

export type RichEditorContentProps = BoxProps & {
	value: string;
	onValueChanged?: (value: string) => void;
};

export const RichEditorContent = ({
	value,
	onValueChanged,
	...props
}: RichEditorContentProps) => {
	const [editor] = useLexicalComposerContext();

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
		<Box
			position="relative"
			display="flex"
			width="100%"
			height="100%"
			overflow="hidden"
			sx={{
				'& pre': {
					whiteSpace: 'break-spaces',
				},
				'& hr': {
					borderColor: 'surface.border',
				},
			}}
		>
			<ContextMenu renderer={GenericContextMenu} />

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
			<HistoryPlugin />
			{/* <AutoFocusPlugin /> */}
			<ListPlugin />
			<CheckListPlugin />
			<TabIndentationPlugin />
			<LinkPlugin />
			<ImagesPlugin />

			<MarkdownShortcutPlugin />
			<FormattingPlugin />
			<EditorPanelPlugin />

			<AppLinks />

			<DropFilesPlugin />

			<ClearEditorPlugin />
			<ClickableLinkPlugin />
			<HashtagPlugin />
			<HorizontalRulePlugin />
			<TablePlugin />
			<OnChangePlugin
				onChange={(_, editor) => {
					if (!isActive()) return;

					editor.read(() => {
						onChange($convertToMarkdownString());
					});
				}}
			/>
		</Box>
	);
};
