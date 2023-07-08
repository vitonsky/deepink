import { useEffect } from 'react';
import { editor, Position } from 'monaco-editor-core';

import { FileId } from '../../Providers';

export type FileUploader = (file: File) => Promise<FileId>;

type Props = {
	editor: editor.IStandaloneCodeEditor | null;
	uploadFile: FileUploader;
};

/**
 * Handle drop files, to upload and insert markdown link
 */
export const useDropFiles = ({ editor: editorObject, uploadFile }: Props) => {
	useEffect(() => {
		if (editorObject === null) return;

		console.log('Editor', editorObject);

		const editorContainer = editorObject.getContainerDomNode();

		const insertFiles = async (files: FileList, position: Position) => {
			const { column, lineNumber } = position;

			const urls = await Promise.all(
				Array.from(files).map((file) =>
					uploadFile(file).then((fileId) => {
						return `[${file.name}](deepink://file/${fileId})`;
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

			// console.log('file', { files, editor: editorObject });

			if (pointerPosition) {
				insertFiles(files, pointerPosition);
			}
			(editorObject as any).removeDropIndicator();
		};

		editorContainer.addEventListener('drop', onDropFiles, { capture: true });

		return () => {
			mouseMoveEvent.dispose();
			editorContainer.removeEventListener('drop', onDropFiles, { capture: true });
		};
	}, [editorObject, uploadFile]);
};
