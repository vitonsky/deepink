import React, { useCallback } from 'react';
import { Box, HStack } from '@chakra-ui/react';
import { useFilesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useAppSelector } from '@state/redux/hooks';
import { selectEditorMode } from '@state/redux/settings/settings';

import { FileUploader } from '../MonakoEditor/features/useDropFiles';
import { MonacoEditor } from '../MonakoEditor/MonacoEditor';
import { EditorPanelContext } from './EditorPanel';
import { EditorPanel } from './EditorPanel/EditorPanel';
import { RichEditor } from './RichEditor/RichEditor';

export const NoteEditor = ({
	text,
	setText,
	isReadOnly,
}: {
	text: string;
	setText: (text: string) => void;
	isReadOnly?: boolean;
}) => {
	const editorMode = useAppSelector(selectEditorMode);

	const filesRegistry = useFilesRegistry();
	const uploadFile: FileUploader = useCallback(
		async (file) => {
			return filesRegistry.add(file);
		},
		[filesRegistry],
	);

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
						readOnly={isReadOnly}
					/>
				)}
				{(editorMode === 'richtext' || editorMode === 'split-screen') && (
					<RichEditor
						placeholder="Write your thoughts here..."
						value={text}
						onChanged={setText}
						isReadOnly={isReadOnly}
					/>
				)}
			</HStack>
		</EditorPanelContext>
	);
};

NoteEditor.displayName = 'NoteEditor';
