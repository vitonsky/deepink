import { useCallback, useEffect } from 'react';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectActiveProfile, workspacesApi } from '@state/redux/profiles/profiles';

export const useProfileSelector = (config: ConfigStorage) => {
	const dispatch = useAppDispatch();

	const currentProfile = useAppSelector(selectActiveProfile);
	const setCurrentProfile = useCallback(
		(profileId: string | null) => {
			dispatch(workspacesApi.setActiveProfile(profileId));
		},
		[dispatch],
	);

	// Write recent profile to config
	useEffect(() => {
		if (currentProfile !== null) {
			config.set('activeProfile', currentProfile);
		}
	}, [config, currentProfile]);

	return [currentProfile, setCurrentProfile] as const;
};
