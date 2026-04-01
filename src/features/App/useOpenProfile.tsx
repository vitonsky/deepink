import { useCallback } from 'react';
import { ProfileObject } from '@core/storage/ProfilesManager';

import {
	ProfilesApi,
	VaultOpenError,
	VaultOpenErrorCode,
} from './Profiles/hooks/useProfileContainers';

type PickProfileResponse = { status: 'ok' } | { status: 'error'; message: string };

export type OnPickProfile = (
	profile: ProfileObject,
	password?: string,
) => Promise<PickProfileResponse>;

export const useOpenProfile = (profiles: ProfilesApi): OnPickProfile => {
	return useCallback(
		async (profile: ProfileObject, password?: string) => {
			try {
				// Profiles with no password
				if (!profile.encryption) {
					await profiles.openProfile({ profile }, true);

					return { status: 'ok' };
				}

				// Profiles with password
				if (password === undefined) {
					return { status: 'error', message: 'Enter password' };
				}

				await profiles.openProfile({ profile, password }, true);

				return { status: 'ok' };
			} catch (err) {
				if (
					err instanceof VaultOpenError &&
					err.code === VaultOpenErrorCode.INCORRECT_PASSWORD
				) {
					return { status: 'error', message: 'Invalid password' };
				}

				throw err;
			}
		},
		[profiles],
	);
};
