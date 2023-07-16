import { IDisposable } from "monaco-editor-core";

import { EditorExtension } from ".";

export const DevTools: EditorExtension = (editorInstance) => {
	const disposeList: IDisposable[] = [];

	disposeList.push(editorInstance.addAction({
		id: 'printEditorInstance',
		label: 'Print current editor instance in console',
		run(editor) {
			console.log('Editor instance', editor);
		},
	}));

	return () => {
		disposeList.forEach((item) => item.dispose());
	};
};