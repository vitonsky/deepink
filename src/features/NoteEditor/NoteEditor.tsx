import React, { useCallback, useEffect, useRef } from 'react';
import {
	$createRangeSelection,
	$getRoot,
	$getSelection,
	$setSelection,
	LexicalEditor,
} from 'lexical';
import { Box, HStack } from '@chakra-ui/react';
import { useFilesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectSearch } from '@state/redux/profiles/profiles';
import { selectEditorMode } from '@state/redux/settings/settings';

import { FileUploader } from '../MonakoEditor/features/useDropFiles';
import { MonacoEditor, MonacoEditorInstance } from '../MonakoEditor/MonacoEditor';
import { EditorPanelContext } from './EditorPanel';
import { EditorPanel } from './EditorPanel/EditorPanel';
import { RichEditor } from './RichEditor/RichEditor';

export const NoteEditor = ({
	text,
	setText,
	isReadOnly,
	isActive,
}: {
	text: string;
	setText: (text: string) => void;
	isReadOnly?: boolean;
	isActive?: boolean;
}) => {
	const editorMode = useAppSelector(selectEditorMode);
	const search = useWorkspaceSelector(selectSearch);

	const filesRegistry = useFilesRegistry();
	const uploadFile: FileUploader = useCallback(
		async (file) => {
			return filesRegistry.add(file);
		},
		[filesRegistry],
	);

	// TODO: expose a limited API to focus editor
	const monacoRef = useRef<MonacoEditorInstance>(null);
	const lexicalRef = useRef<LexicalEditor>(null);
	const focusEditor = useCallback(async () => {
		const startTime = Date.now();

		while (true) {
			const monaco = monacoRef.current;
			if (monaco) {
				monaco.focus();
				break;
			}

			const lexical = lexicalRef.current;
			if (lexical) {
				lexical.update(() => {
					if ($getSelection()) return;

					const root = $getRoot();
					const firstChild = root.getAllTextNodes()[0];

					if (!firstChild) {
						return;
					}

					const selection = $createRangeSelection();
					selection.anchor.set(firstChild.getKey(), 0, 'text');
					selection.focus.set(firstChild.getKey(), 0, 'text');
					$setSelection(selection);
				});
				lexical.focus();
				break;
			}

			if (Date.now() - startTime >= 300) break;

			await new Promise((res) => requestAnimationFrame(res));
		}
	}, []);

	useEffect(() => {
		if (!isActive) return;

		focusEditor();
	}, [focusEditor, isActive, editorMode]);

	return (
		<EditorPanelContext>
			{!isReadOnly && (
				<HStack align="start" w="100%" overflowX="auto" flexShrink={0}>
					<EditorPanel />
				</HStack>
			)}

			<HStack
				sx={{
					display: 'flex',
					width: '100%',
					height: '100%',
					overflow: 'hidden',
				}}
			>
				{(editorMode === 'plaintext' || editorMode === 'split-screen') && (
					<Box
						as={MonacoEditor}
						value={text}
						setValue={setText}
						flexGrow="100"
						uploadFile={uploadFile}
						width="100%"
						height="100%"
						minW="0"
						isReadOnly={isReadOnly}
						editorObjectRef={monacoRef}
					/>
				)}
				{(editorMode === 'richtext' || editorMode === 'split-screen') && (
					<RichEditor
						placeholder="Write your thoughts here..."
						value={text}
						onChanged={setText}
						isReadOnly={isReadOnly}
						search={search || undefined}
						lexicalRef={lexicalRef}
					/>
				)}
			</HStack>
		</EditorPanelContext>
	);
};

NoteEditor.displayName = 'NoteEditor';
