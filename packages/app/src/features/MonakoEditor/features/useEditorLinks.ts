import { useEffect } from 'react';
import { editor, languages } from 'monaco-editor-core';
import { findLinksInText } from '@core/features/links';
import { useUrlOpener } from '@hooks/useUrlOpener';

/**
 * Hook to enable app links handling in monaco editor
 *
 * WARNING: this hook are modify global objects, so must be used only once
 */
export const useEditorLinks = () => {
	const openUrl = useUrlOpener();

	// Register files opener
	useEffect(() => {
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
				return openUrl(resource.toString());
			},
		});

		return () => {
			mdLinkProvider.dispose();
			appLinkOpener.dispose();
		};
	}, [openUrl]);
};
