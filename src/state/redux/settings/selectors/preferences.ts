import { createAppSelector } from '@state/redux/utils';

import { selectSettings } from '../settings';

export const selectConfirmMoveToBin = createAppSelector(
	selectSettings,
	(settings) => settings.preferences.confirmBeforeMoveToBin,
);

export const selectEditorConfig = createAppSelector(
	selectSettings,
	(settings) => settings.editor,
);

export const selectTheme = createAppSelector(
	selectSettings,
	(settings) => settings.theme,
);
