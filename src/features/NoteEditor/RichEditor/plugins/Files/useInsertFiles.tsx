import { useCallback } from 'react';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isBlockElementNode,
	LexicalNode,
} from 'lexical';
import prettyBytes from 'pretty-bytes';
import { formatResourceLink } from '@core/features/links';
import { useFilesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { $createLinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { $getCursorNode, $insertAfter } from '../../utils/selection';

import { $createImageNode } from '../Image/ImageNode';

const MEGABYTE_SIZE = 1024 ** 2;
const alertLimits = {
	filesSize: MEGABYTE_SIZE * 50,
	filesLength: 10,
};

export const useInsertFiles = () => {
	const [editor] = useLexicalComposerContext();

	const filesRegistry = useFilesRegistry();

	return useCallback(
		async (files: FileList, targetNode?: LexicalNode | null) => {
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
					const nodes = $isBlockElementNode(selectedNode)
						? fileNodes.map((node) => {
								const paragraph = $createParagraphNode();
								paragraph.append(node);
								return paragraph;
						  })
						: fileNodes;

					$insertAfter(selectedNode, nodes);
				} else {
					const root = $getRoot();

					const paragraph = $createParagraphNode();
					root.append(paragraph);

					paragraph.append(...fileNodes);
				}
			});
		},
		[editor, filesRegistry],
	);
};
