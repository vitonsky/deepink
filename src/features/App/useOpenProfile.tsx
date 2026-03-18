import { useCallback, useState } from 'react';
import { ProfileObject } from '@core/storage/ProfilesManager';

import { useVaultOpenErrorToast } from './Profile/useVaultOpenErrorToast';
import {
	ProfileOpenError,
	ProfileOpenErrorCode,
	ProfilesApi,
} from './Profiles/hooks/useProfileContainers';

type PickProfileResponse = {
	status: 'ok' | 'error';
	message?: string;
};
export type OnPickProfile = (
	profile: ProfileObject,
	password?: string,
) => Promise<PickProfileResponse>;

/** Handles profile opening for both encrypted and unencrypted profiles */
export const useOpenProfile = (profiles: ProfilesApi) => {
	const { show: showError } = useVaultOpenErrorToast();
	const [isProfileOpening, setIsProfileOpening] = useState(false);

	const onOpenProfile: OnPickProfile = useCallback(
		async (profile: ProfileObject, password?: string) => {
			setIsProfileOpening(true);
			// Profiles with no password
			if (!profile.encryption) {
				try {
					await profiles.openProfile({ profile }, true);

					return { status: 'ok' };
				} catch (err) {
					console.error(err);

					// Show error for profile without encryption
					showError(profile.id, 'Failed to open profile');

					return { status: 'error', message: 'Unknown error' };
				} finally {
					setIsProfileOpening(false);
				}
			}

			// Profiles with password
			try {
				if (password === undefined) {
					return { status: 'error', message: 'Enter password' };
				}

				await profiles.openProfile({ profile, password }, true);

				return { status: 'ok' };
			} catch (err) {
				console.error(err);

				if (
					err instanceof ProfileOpenError &&
					err.code === ProfileOpenErrorCode.INCORRECT_PASSWORD
				) {
					return { status: 'error', message: 'Invalid password' };
				}

				return { status: 'error', message: 'Unknown error' };
			} finally {
				setIsProfileOpening(false);
			}
		},
		[profiles, showError],
	);
	return { onOpenProfile, isProfileOpening };
};
