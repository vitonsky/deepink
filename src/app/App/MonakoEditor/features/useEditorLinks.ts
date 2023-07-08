
import { useEffect } from 'react';
import saveAs from 'file-saver';
import { CancellationToken, editor, languages } from 'monaco-editor-core';

import { useFilesRegistry } from '../../Providers';

/**
 * Hook to enable app links handling in monaco editor
 * 
 * WARNING: this hook are modify global objects, so must be used only once
 */
export const useEditorLinks = () => {
	const filesRegistry = useFilesRegistry();

	// Register files opener
	useEffect(() => {
		if (filesRegistry === null) return;

		const mdLinkProvider = languages.registerLinkProvider('markdown', {
			provideLinks:
				(model: editor.ITextModel, token: CancellationToken):
					languages.ProviderResult<languages.ILinksList> => {
					console.log('Link provider', { model, token });

					return {
						links: Array.from(model.getValue().matchAll(/deepink:\/\/(file)\/[\d\a-z\-]+/gi)).map((match) => {
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

		const appLinkOpener = editor.registerLinkOpener({
			async open(resource) {
				console.log('Resource handler', resource);

				if (resource.scheme !== 'deepink') return false;
				if (resource.authority !== 'file') return false;

				const fileId = resource.path.slice(1);
				// const isConfirmed = confirm(`Download file "${fileId}"?`);
				// if (!isConfirmed) return false;

				const file = await filesRegistry.get(fileId);
				if (!file) return false;

				const buffer = await file.arrayBuffer();
				saveAs(new Blob([buffer]), file.name);
				return true;
			},
		});

		return () => {
			mdLinkProvider.dispose();
			appLinkOpener.dispose();
		};
	}, [filesRegistry]);
};