import React, {
	FC,
	HTMLAttributes,
	RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { saveAs } from 'file-saver';
import { CancellationToken, editor, languages } from 'monaco-editor-core';

import { getFile } from '../../../electron/requests/storage/renderer';

import { FileUploader, useDropFiles } from './features/useDropFiles';
import { language as mdlanguage } from './languages/markdown';
import { language as tslanguage } from './languages/typescript';

// Configure monako
languages.register({
	id: 'javascript',
	extensions: ['.js', '.es6', '.jsx', '.mjs', '.cjs'],
	firstLine: '^#!.*\\bnode',
	filenames: ['jakefile'],
	aliases: ['JavaScript', 'javascript', 'js'],
	mimetypes: ['text/javascript'],
});

languages.setMonarchTokensProvider('javascript', tslanguage);

languages.register({
	id: 'markdown',
	extensions: [
		'.md',
		'.markdown',
		'.mdown',
		'.mkdn',
		'.mkd',
		'.mdwn',
		'.mdtxt',
		'.mdtext',
	],
	aliases: ['Markdown', 'markdown'],
});

languages.setMonarchTokensProvider('markdown', mdlanguage);

languages.registerLinkProvider('markdown', {
	provideLinks:
		(model: editor.ITextModel, token: CancellationToken):
			languages.ProviderResult<languages.ILinksList> => {
			console.log('Link provider', { model, token });

			return {
				links: Array.from(model.getValue().matchAll(/deepink:\/\/[\d\a-z\-]+/gi)).map((match) => {
					const index = match.index as number;
					const matchString = match[0] as string;
					const startPosition = model.getPositionAt(index);
					const endPosition = model.getPositionAt(index + matchString.length);

					return {
						range: {
							startLineNumber: startPosition.lineNumber,
							startColumn: startPosition.column,
							endLineNumber: endPosition.lineNumber,
							endColumn: endPosition.column
						},
						url: matchString
					};
				})
			};
		},
});

editor.registerLinkOpener({
	async open(resource) {
		const fileId = resource.authority;
		// const isConfirmed = confirm(`Download file "${fileId}"?`);
		// if (!isConfirmed) return false;

		const buffer = await getFile(fileId);

		saveAs(new Blob([buffer]), fileId + '.png');
		return true;
	},
});

export type EditorObject = {
	updateDimensions: () => void;
} | null;

export type MonacoEditorProps = HTMLAttributes<HTMLDivElement> & {
	value: string;
	setValue?: (value: string) => void;
	editorObjectRef?: RefObject<EditorObject>;
	uploadFile: FileUploader;
};

/**
 * Rich editor from VSCode
 * See docs: https://microsoft.github.io/monaco-editor/docs.html
 */
export const MonacoEditor: FC<MonacoEditorProps> = ({
	value,
	setValue,
	editorObjectRef,
	uploadFile,
	...props
}) => {
	const setValueRef = useRef(setValue);
	setValueRef.current = setValue;

	// Init
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
	const [editorObject, setEditorObject] = useState<editor.IStandaloneCodeEditor | null>(null);

	const updateDimensions = useCallback(() => {
		const editorContainer = editorContainerRef.current;
		const monacoEditor = editorRef.current;
		if (!editorContainer || !monacoEditor) return;

		monacoEditor.layout({ width: 0, height: 0 });

		requestAnimationFrame(() => {
			const containerRect = editorContainer.getClientRects()[0];
			if (!containerRect) return;

			const { width, height } = containerRect;
			monacoEditor.layout({ width, height });
		});
	}, []);

	useEffect(() => {
		const editorContainer = editorContainerRef.current;
		if (!editorContainer) return;

		const monacoEditor = editor.create(editorContainer, {
			value,
			language: 'markdown',
			automaticLayout: true,
			wordWrap: 'on',
			// dropIntoEditor: { enabled: true },
		});

		editorRef.current = monacoEditor;

		// Update value
		monacoEditor.onDidChangeModelContent((evt) => {
			if (evt.changes.length === 0) return;
			if (setValueRef.current) {
				setValueRef.current(monacoEditor.getValue());
			}
		});

		// Ignore keys while focus on editor
		const onKeyPress = (evt: KeyboardEvent) => {
			if (monacoEditor.hasWidgetFocus()) {
				evt.stopPropagation();
			}
		};

		editorContainer.addEventListener('keydown', onKeyPress);
		editorContainer.addEventListener('keyup', onKeyPress);

		// Handle window resize
		window.addEventListener('resize', updateDimensions);

		setEditorObject(monacoEditor);

		return () => {
			editorContainer.removeEventListener('keydown', onKeyPress);
			editorContainer.removeEventListener('keyup', onKeyPress);
			window.removeEventListener('resize', updateDimensions);

			monacoEditor.dispose();

			setEditorObject(null);
		};

		// Hook runs only once to initialize component
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Update value
	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;

		if (editor.getValue() !== value) {
			editor.setValue(value);
		}
	});

	// Handle drop file
	useDropFiles({ editor: editorObject, uploadFile });

	return <div ref={editorContainerRef} {...props}></div>;
};
