import { useEffect } from 'react';
import saveAs from 'file-saver';
import { editor, languages } from 'monaco-editor-core';

import { findLinksInText, getAppResourceDataInUrl } from '../../../../core/links';
import { openLink } from '../../../../electron/requests/interactions/renderer';
import { useNotesControl } from '../../MainScreen/useNotesControl';
import { useFilesRegistry } from '../../Providers';

/**
 * Hook to enable app links handling in monaco editor
 *
 * WARNING: this hook are modify global objects, so must be used only once
 */
export const useEditorLinks = () => {
	const filesRegistry = useFilesRegistry();
	const notesControl = useNotesControl();

	// Register files opener
	useEffect(() => {
		if (filesRegistry === null) return;

		const mdLinkProvider = languages.registerLinkProvider('markdown', {
			provideLinks: (
				model: editor.ITextModel,
			): languages.ProviderResult<languages.ILinksList> => {
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
								endColumn: endPosition.column,
							},
						};
					}),
				};
			},
		});

		const appLinkOpener = editor.registerLinkOpener({
			async open(resource) {
				if (/^https?$/.test(resource.scheme)) {
					openLink(resource.toString());
					return true;
				}

				const resourceData = getAppResourceDataInUrl(resource);
				if (!resourceData) return false;

				switch (resourceData.type) {
					case 'resource': {
						const file = await filesRegistry.get(resourceData.id);
						if (!file) return false;

						const buffer = await file.arrayBuffer();
						saveAs(new Blob([buffer]), file.name);
						return true;
					}
					case 'note': {
						notesControl.open(resourceData.id);
						return true;
					}
				}
			},
		});

		return () => {
			mdLinkProvider.dispose();
			appLinkOpener.dispose();
		};
	}, [filesRegistry, notesControl]);
};
