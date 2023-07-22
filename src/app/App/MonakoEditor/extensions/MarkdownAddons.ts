import { MonacoMarkdownExtension } from "monaco-markdown";

import { EditorExtension } from ".";

export const MarkdownAddons: EditorExtension = (editorInstance) => {
	// TODO: #13 adopt and inline code from https://github.com/yzhang-gh/vscode-markdown/blob/83f602638bf96f5249e3b9856baf9f31b933fad1/src/listEditing.ts
	// extension package are outdated and may have bugs due to use old version of monaco editor API
	const extension = new MonacoMarkdownExtension();
	extension.activate(editorInstance as any);
};