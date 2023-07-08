
import { useEffect } from 'react';
import saveAs from 'file-saver';
import { CancellationToken, editor, languages } from 'monaco-editor-core';

import { findLinksInText, getResourceIdInUrl } from '../../../../core/links';
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
						links: findLinksInText(model.getValue()).map(({ index, url }) => {
							const startPosition = model.getPositionAt(index);
							const endPosition = model.getPositionAt(index + url.length);

							return {
								url,
								range: {
									startLineNumber: startPosition.lineNumber,
									startColumn: startPosition.column,
									endLineNumber: endPosition.lineNumber,
									endColumn: endPosition.column
								},
							};
						})
					};
				},
		});

		const appLinkOpener = editor.registerLinkOpener({
			async open(resource) {
				console.log('Resource handler', resource);

				const fileId = getResourceIdInUrl(resource);
				if (fileId === null) return false;

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