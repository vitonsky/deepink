import { useEffect } from 'react';
import { editor, Position } from 'monaco-editor-core';
import prettyBytes from 'pretty-bytes';

import { formatResourceLink } from '../../../../core/links';
import { FileId } from '../../Providers';

export type FileUploader = (file: File) => Promise<FileId>;

type Props = {
	editor: editor.IStandaloneCodeEditor | null;
	uploadFile: FileUploader;
};

const MEGABYTE_SIZE = 1024 ** 2;

const alertLimits = {
	filesSize: MEGABYTE_SIZE * 50,
	filesLength: 10,
};

/**
 * Handle drop files, to upload and insert markdown link
 */
export const useDropFiles = ({ editor: editorObject, uploadFile }: Props) => {
	useEffect(() => {
		if (editorObject === null) return;

		console.log('Editor', editorObject);

		const editorContainer = editorObject.getContainerDomNode();
		const rootElement = editorContainer.ownerDocument;

		const insertFiles = async (files: FileList, position: Position) => {
			const filesSize = Array.from(files).reduce((acc, file) => acc + file.size, 0);

			// Show confirmation dialog for unusual activity
			if (files.length > alertLimits.filesLength || filesSize > alertLimits.filesSize) {
				// May be replaced to Intl: https://stackoverflow.com/a/73974452/18680275
				const humanReadableBytes = prettyBytes(filesSize);

				const isConfirmed = confirm(`Are you sure to upload ${files.length} files with ${humanReadableBytes}?`);
				if (!isConfirmed) return;
			}

			const { column, lineNumber } = position;

			const urls = await Promise.all(
				Array.from(files).map((file) =>
					uploadFile(file).then((fileId) => {
						const escapedFilename = file.name.replace(/(\[|\])/g, '\\$1');
						const imagePrefix = file.type.startsWith('image/') ? '!' : '';
						return `${imagePrefix}[${escapedFilename}](${formatResourceLink(fileId)})`;
					}),
				),
			);

			editorObject.executeEdits('drop-files', [
				{
					text: urls.join(' '),
					range: {
						startColumn: column,
						endColumn: column,
						startLineNumber: lineNumber,
						endLineNumber: lineNumber,
					},
				},
			]);
		};

		let pointerPosition: Position | null = null;
		const mouseMoveEvent = editorObject.onMouseMove((evt) => {
			pointerPosition = evt.target.position;
		});

		const onDropFiles = (event: DragEvent) => {
			if (event.dataTransfer === null) return;

			const files = event.dataTransfer.files;
			if (files.length === 0) return;

			event.stopImmediatePropagation();

			if (pointerPosition) {
				insertFiles(files, pointerPosition);
			}
			(editorObject as any).removeDropIndicator();
		};
		editorContainer.addEventListener('drop', onDropFiles, { capture: true });

		const onPaste = (event: ClipboardEvent) => {
			const isEventOnEditor = event.target instanceof HTMLElement && editorContainer.contains(event.target);
			if (!isEventOnEditor) return;

			if (event.clipboardData === null) return;

			const files = event.clipboardData.files;
			if (files.length === 0) return;

			event.stopImmediatePropagation();
			event.preventDefault();

			const position = editorObject.getPosition() || new Position(0, 0);
			insertFiles(files, position);
		};
		rootElement.addEventListener('paste', onPaste, { capture: true });

		return () => {
			mouseMoveEvent.dispose();
			editorContainer.removeEventListener('drop', onDropFiles, { capture: true });
			rootElement.removeEventListener('paste', onPaste, { capture: true });
		};
	}, [editorObject, uploadFile]);
};
