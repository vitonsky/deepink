import { useEffect } from 'react';
import { COMMAND_PRIORITY_NORMAL, createCommand, LexicalNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';

import { useInsertFiles } from './useInsertFiles';

/**
 * Insert files at cursor position or at provided node
 */
export const INSERT_FILES_COMMAND = createCommand<{
	files: FileList;
	targetNode?: LexicalNode | null;
}>();

/**
 * Plugin to support files attachments.
 * Introduce command to handle files insertion.
 */
export const FilesPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const $insertFiles = useInsertFiles();

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				INSERT_FILES_COMMAND,
				({ files, targetNode }) => {
					$insertFiles(files, targetNode);
					return true;
				},
				COMMAND_PRIORITY_NORMAL,
			),
		);
	}, [$insertFiles, editor]);

	return null;
};
