import { editor } from "monaco-editor-core";

import { DevTools } from "./DevTools";
import { MarkdownAddons } from "./MarkdownAddons";

export type EditorExtension = (editor: editor.IStandaloneCodeEditor) => void | (() => void);

export const defaultExtensions: EditorExtension[] = [
	DevTools,
	MarkdownAddons,
];