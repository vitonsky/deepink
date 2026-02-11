import { useCallback } from 'react';
import { ProfileObject } from '@core/storage/ProfilesManager';

import { ProfilesApi } from './Profiles/hooks/useProfileContainers';
import { OnPickProfile } from './WorkspaceManager';

export const useOpenProfile = (profileContainers: ProfilesApi) => {
	const onOpenProfile: OnPickProfile = useCallback(
		async (profile: ProfileObject, password?: string) => {
			// Profiles with no password
			if (!profile.encryption) {
				await profileContainers.openProfile({ profile }, true);
				return { status: 'ok' };
			}

			// Profiles with password
			if (password === undefined)
				return { status: 'error', message: 'Enter password' };

			try {
				await profileContainers.openProfile({ profile, password }, true);
				return { status: 'ok' };
			} catch (err) {
				console.error(err);

				return { status: 'error', message: 'Invalid password' };
			}
		},
		[profileContainers],
	);

	return onOpenProfile;
};
