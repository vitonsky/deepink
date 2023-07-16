import React, {
	FC,
	HTMLAttributes,
	RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { editor, IDisposable, languages } from 'monaco-editor-core';

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
			value,
			language: 'markdown',
			automaticLayout: true,
			wordWrap: 'on',
			quickSuggestions: false,
		});

		const disposeList: IDisposable[] = [];

		const model = monacoEditor.getModel();
		if (model) {
			const pointerRegEx = /^-( \[(\s|x)\])?/;
			model.onDidChangeContent((evt) => {
				// TODO: implement for all changes
				const change = evt.changes[0];

				console.warn('Change', change);

				const isNewLine = /^\n[\s\t]*$/.test(change.text);
				if (!isNewLine) return;
				if (change.range.startLineNumber !== change.range.endLineNumber) return;

				const lineValue = model.getValueInRange({
					...change.range,
					startColumn: 0,
				});
				const pointMatch = lineValue.trim().match(pointerRegEx);
				if (!pointMatch) return;

				const isCheckboxType = Boolean(pointMatch[1]);
				console.log({ rangeValue: lineValue, isCheckboxType });

				const lineWithChanges = change.range.startLineNumber + 1;
				const columnStartsWithNonWhitespace = model.getLineFirstNonWhitespaceColumn(lineWithChanges);
				const lineWithChangesLen = model.getLineLength(lineWithChanges);
				const columnToInsert = columnStartsWithNonWhitespace > 0 ? columnStartsWithNonWhitespace : lineWithChangesLen + 1;

				const textToInsert = '- ' + (isCheckboxType ? '[ ] ' : '');

				monacoEditor.executeEdits('insert.bulletPoint', [
					{
						text: textToInsert,
						range: {
							startLineNumber: lineWithChanges,
							endLineNumber: lineWithChanges,
							startColumn: columnToInsert,
							endColumn: columnToInsert,
						},
					},
				]);

				// TODO: use arguments of `executeEdits` method to change cursor position
				// Set cursor
				requestAnimationFrame(() => {
					monacoEditor.setPosition({
						lineNumber: lineWithChanges,
						column: columnToInsert + textToInsert.length,
					});
				});
			});
		}

		disposeList.push(
			monacoEditor.addAction({
				id: 'printEditorInstance',
				label: 'Print current editor instance in console',
				run(editor) {
					console.log(editor);
				},
			}),
		);

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

			disposeList.forEach((item) => item.dispose());
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
