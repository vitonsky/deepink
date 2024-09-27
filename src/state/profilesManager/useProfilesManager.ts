import { useCallback, useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import { bytesToBase64 } from '@core/encryption/utils/encoding';
import { getRandomBytes } from '@core/encryption/utils/random';
import { createEncryption } from '@core/features/encryption/createEncryption';
import { ProfileObject, ProfilesManager } from '@core/storage/ProfilesManager';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { NewProfile } from '@features/App/WorkspaceManager/ProfileCreator';

import { createProfilesManagerApi } from './profilesManager';

export type ProfilesManagerApi = {
	profiles: ProfileObject[] | null;
	createProfile: (profile: NewProfile) => Promise<void>;
};

/**
 * Hook to manage profile accounts
 */
export const useProfilesManager = (): ProfilesManagerApi => {
	const [profilesManager] = useState(
		() =>
			new ProfilesManager(
				new ElectronFilesController('/'),
				(profileName) => new ElectronFilesController(`/${profileName}`),
			),
	);

	const [profilesManagerApi] = useState(createProfilesManagerApi);

	const profiles = useUnit(profilesManagerApi.$profiles);

	const updateProfiles = useCallback(
		() =>
			profilesManager.getProfiles().then(profilesManagerApi.events.profilesUpdated),
		[profilesManager, profilesManagerApi.events.profilesUpdated],
	);

	// Init state
	useEffect(() => {
		updateProfiles();
	}, [updateProfiles]);

	const createProfile = useCallback(
		async (profile: NewProfile) => {
			// Create profile with no encryption
			if (profile.password === null) {
				await profilesManager.add({
					name: profile.name,
					encryption: null,
				});
				return;
			}

			// Create encrypted profile
			const salt = getRandomBytes(96);

			const encryption = await createEncryption({ key: profile.password, salt });

			const key = getRandomBytes(32);
			const encryptedKey = await encryption
				.getContent()
				.encrypt(key)
				.finally(() => encryption.dispose());

			await profilesManager.add({
				name: profile.name,
				encryption: {
					algorithm: 'default',
					salt: bytesToBase64(salt),
					key: encryptedKey,
				},
			});

			updateProfiles();
		},
		[profilesManager, updateProfiles],
	);

	return {
		profiles,
		createProfile,
	};
};
