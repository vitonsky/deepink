import { createAppSelector } from '@state/redux/utils';

import { selectSettings } from '../settings';

export const selectProfileScreenMode = createAppSelector(
	selectSettings,
	(settings) => settings.profileScreenMode,
);
