import { createAppSelector } from '@state/redux/utils';

import { selectSettings } from '../settings';
import { normalizeFontFamily } from './utils';

export const selectConfirmMoveToBin = createAppSelector(
	selectSettings,
	(settings) => settings.preferences.confirmBeforeMoveToBin,
);

export const selectEditorConfig = createAppSelector(
	selectSettings,
	(settings) => settings.editor,
);

export const selectEditorFontFamily = createAppSelector(
	selectEditorConfig,
	({ fontFamily }) => {
		 
		const fallback =
			'-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", "Segoe UI Variable", "Noto Sans", "Ubuntu", "Cantarell", "Helvetica Neue", Arial, system-ui, sans-serif';

		const normalizedFontFamily = normalizeFontFamily(fontFamily);

		if (!normalizedFontFamily) return fallback;
		return `${normalizedFontFamily}, ${fallback}`;
	},
);

export const selectTheme = createAppSelector(
	selectSettings,
	(settings) => settings.theme,
);
