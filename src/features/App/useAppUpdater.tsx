import { useEffect } from 'react';
import { useAppSelector } from '@state/redux/hooks';
import { selectIsCheckForUpdatesEnabled } from '@state/redux/settings/selectors/preferences';

import { useGetAppUpdates } from './useGetAppUpdates';

export const useAppUpdater = () => {
	const isCheckForUpdatesEnabled = useAppSelector(selectIsCheckForUpdatesEnabled);

	const checkForUpdates = useGetAppUpdates();

	useEffect(() => {
		if (!isCheckForUpdatesEnabled) return;

		checkForUpdates();
	}, [checkForUpdates, isCheckForUpdatesEnabled]);
};
