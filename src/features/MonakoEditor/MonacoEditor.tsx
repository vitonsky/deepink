/* eslint-disable spellcheck/spell-checker */
import React, {
	FC,
	HTMLAttributes,
	RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { editor, languages } from 'monaco-editor-core';

import { defaultExtensions } from './extensions';
import { FileUploader, useDropFiles } from './features/useDropFiles';
import * as markdown from './languages/markdown';
import * as typescript from './languages/typescript';

// Configure monako
languages.register({
	id: 'javascript',
	extensions: ['.js', '.es6', '.jsx', '.mjs', '.cjs'],
	firstLine: '^#!.*\\bnode',
	filenames: ['jakefile'],
	aliases: ['JavaScript', 'javascript', 'js'],
	mimetypes: ['text/javascript'],
});

languages.setMonarchTokensProvider('javascript', typescript.language);
languages.setLanguageConfiguration('javascript', typescript.conf);

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

languages.setMonarchTokensProvider('markdown', markdown.language);
languages.setLanguageConfiguration('markdown', markdown.conf);

export type EditorObject = {
	updateDimensions: () => void;
} | null;

export type MonacoEditorProps = HTMLAttributes<HTMLDivElement> & {
	value: string;
	setValue?: (value: string) => void;
	editorObjectRef?: RefObject<EditorObject>;
	uploadFile: FileUploader;
	isReadOnly?: boolean;
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
	isReadOnly,
	...props
}) => {
	const setValueRef = useRef(setValue);
	setValueRef.current = setValue;

	// Init
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
	const [editorObject, setEditorObject] = useState<editor.IStandaloneCodeEditor | null>(
		null,
	);

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
			readOnly: isReadOnly,
			value,
			language: 'markdown',
			automaticLayout: true,
			wordWrap: 'on',
			quickSuggestions: false,
			unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: true },
			folding: false,
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

		// Enable extensions
		const extensionsCleanupCallbacks = defaultExtensions.map((extension) =>
			extension(monacoEditor),
		);

		setEditorObject(monacoEditor);

		// Set focus
		monacoEditor.focus();

		return () => {
			editorContainer.removeEventListener('keydown', onKeyPress);
			editorContainer.removeEventListener('keyup', onKeyPress);
			window.removeEventListener('resize', updateDimensions);

			extensionsCleanupCallbacks.forEach((callback) => {
				if (callback) {
					callback();
				}
			});

			monacoEditor.dispose();

			setEditorObject(null);
		};

		// Hook runs only once to initialize component
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Control over readonly mode
	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.updateOptions({ readOnly: isReadOnly });
		}
	}, [isReadOnly]);

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
