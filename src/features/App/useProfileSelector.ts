import { useEffect, useRef, useState } from 'react';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { ProfileObject } from '@core/storage/ProfilesManager';

export const useProfileSelector = (
	config: ConfigStorage,
	profiles: ProfileObject[] | null,
	onRestoreLastActiveProfile?: (profile: ProfileObject) => void,
) => {
	const state = useState<null | string>(null);

	const [currentProfile, setCurrentProfile] = state;
	const isActiveProfileRestoredRef = useRef(false);
	useEffect(() => {
		if (profiles === null) return;
		if (isActiveProfileRestoredRef.current) return;

		config.get('activeProfile').then((activeProfile) => {
			isActiveProfileRestoredRef.current = true;

			if (activeProfile) {
				setCurrentProfile(activeProfile);

				if (!onRestoreLastActiveProfile || !profiles) return;

				const profile = profiles.find((profile) => profile.id === activeProfile);
				if (profile) {
					onRestoreLastActiveProfile(profile);
				}
			}
		});
	}, [onRestoreLastActiveProfile, profiles, setCurrentProfile]);

	useEffect(() => {
		if (currentProfile !== null) {
			config.set('activeProfile', currentProfile);
		}
	}, [currentProfile]);

	return state;
};
