import { useEffect } from 'react';
import {
	$getNearestNodeFromDOMNode,
	COMMAND_PRIORITY_LOW,
	DROP_COMMAND,
	PASTE_COMMAND,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';

import { useInsertFiles } from './useInsertFiles';

export const DropFilesPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const $insertFiles = useInsertFiles();

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				DROP_COMMAND,
				(event) => {
					if (event.dataTransfer === null) return false;

					const files = event.dataTransfer.files;
					if (files.length === 0) return false;

					event.stopImmediatePropagation();

					const targetNode =
						event.target instanceof Node
							? $getNearestNodeFromDOMNode(event.target)
							: null;
					$insertFiles(files, targetNode);
					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(
				PASTE_COMMAND,
				(event) => {
					if (
						!(event instanceof ClipboardEvent) ||
						event.clipboardData === null
					)
						return false;

					const files = event.clipboardData.files;
					if (files.length === 0) return false;

					event.stopImmediatePropagation();

					const targetNode =
						event.target instanceof Node
							? $getNearestNodeFromDOMNode(event.target)
							: null;
					$insertFiles(files, targetNode);
					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}, [$insertFiles, editor]);

	return null;
};
