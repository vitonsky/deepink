import { createAppSelector } from '@state/redux/utils';

import { selectSettings } from '../settings';

export const selectConfirmMoveToBin = createAppSelector(
	selectSettings,
	(settings) => settings.preferences.confirmBeforeMoveToBin,
);
