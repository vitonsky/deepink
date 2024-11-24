import { useEffect } from 'react';
import {
	$createParagraphNode,
	$createTextNode,
	$getNearestNodeFromDOMNode,
	$getRoot,
	COMMAND_PRIORITY_CRITICAL,
	DROP_COMMAND,
	LexicalNode,
	PASTE_COMMAND,
} from 'lexical';
import prettyBytes from 'pretty-bytes';
import { formatResourceLink } from '@core/features/links';
import { useFilesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useEditorPanelContext } from '@features/NoteEditor/EditorPanel';
import { $createLinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';

import { $getCursorNode, $insertAfter } from '../utils/selection';
import { $createImageNode } from './Image/ImageNode';

const MEGABYTE_SIZE = 1024 ** 2;

const alertLimits = {
	filesSize: MEGABYTE_SIZE * 50,
	filesLength: 10,
};

export const DropFilesPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const { onInserting } = useEditorPanelContext();

	const filesRegistry = useFilesRegistry();

	useEffect(() => {
		const $insertFiles = async (files: FileList, targetNode?: LexicalNode | null) => {
			const filesSize = Array.from(files).reduce((acc, file) => acc + file.size, 0);

			// Show confirmation dialog for unusual activity
			if (
				files.length > alertLimits.filesLength ||
				filesSize > alertLimits.filesSize
			) {
				// May be replaced to Intl: https://stackoverflow.com/a/73974452/18680275
				const humanReadableBytes = prettyBytes(filesSize);

				const isConfirmed = confirm(
					`Are you sure to upload ${files.length} files with ${humanReadableBytes}?`,
				);
				if (!isConfirmed) return;
			}

			const filesInfo = await Promise.all(
				Array.from(files).map((file) =>
					filesRegistry.add(file).then((fileId) => ({ file, fileId })),
				),
			);

			editor.update(() => {
				const fileNodes = filesInfo.map(({ file, fileId }) => {
					const link = formatResourceLink(fileId);

					const isImage = file.type.startsWith('image/');
					if (isImage) {
						return $createImageNode({ src: link, altText: file.name });
					}

					const linkNode = $createLinkNode(link, { title: file.name });
					linkNode.append($createTextNode(file.name));
					return linkNode;
				});

				const selectedNode =
					targetNode && targetNode.isAttached() ? targetNode : $getCursorNode();
				if (selectedNode) {
					$insertAfter(selectedNode, fileNodes);
				} else {
					const root = $getRoot();

					const paragraph = $createParagraphNode();
					root.append(paragraph);

					paragraph.append(...fileNodes);
				}
			});
		};

		const cleanupRegister = mergeRegister(
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
				COMMAND_PRIORITY_CRITICAL,
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
				COMMAND_PRIORITY_CRITICAL,
			),
		);

		const cleanupInserting = onInserting.watch((evt) => {
			if (evt.type !== 'file') return;

			$insertFiles(evt.data.files);
		});

		return () => {
			cleanupRegister();
			cleanupInserting();
		};
	}, [editor, filesRegistry, onInserting]);

	return null;
};
