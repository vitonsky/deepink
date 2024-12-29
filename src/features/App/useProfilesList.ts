import { useCallback, useEffect, useState } from 'react';
import { bytesToBase64 } from '@core/encryption/utils/encoding';
import { getRandomBytes } from '@core/encryption/utils/random';
import { createEncryption } from '@core/features/encryption/createEncryption';
import { ProfileObject, ProfilesManager } from '@core/storage/ProfilesManager';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { NewProfile } from '@features/App/WorkspaceManager/ProfileCreator';

export type ProfilesListApi = {
	isProfilesLoaded: boolean;
	profiles: ProfileObject[];
	createProfile: (profile: NewProfile) => Promise<ProfileObject>;
};

/**
 * Hook to manage profile accounts
 */
export const useProfilesList = (): ProfilesListApi => {
	const [profilesManager] = useState(
		() =>
			new ProfilesManager(
				new ElectronFilesController('/'),
				(profileName) => new ElectronFilesController(`/${profileName}`),
			),
	);

	const [profiles, setProfiles] = useState<ProfileObject[]>([]);
	const [isProfilesLoaded, setIsProfilesLoaded] = useState(false);

	const updateProfiles = useCallback(
		() =>
			profilesManager.getProfiles().then((profiles) => {
				setProfiles(profiles);
				setIsProfilesLoaded(true);
			}),
		[profilesManager],
	);

	// Init state
	useEffect(() => {
		updateProfiles();
	}, [updateProfiles]);

	const createProfile = useCallback(
		async (profile: NewProfile) => {
			let profileData;
			if (profile.password === null) {
				// Create profile with no encryption
				profileData = await profilesManager.add({
					name: profile.name,
					encryption: null,
				});
			} else {
				// Create encrypted profile
				const salt = getRandomBytes(96);

				const encryption = await createEncryption({
					key: profile.password,
					salt,
				});

				const key = getRandomBytes(32);
				const encryptedKey = await encryption
					.getContent()
					.encrypt(key)
					.finally(() => encryption.dispose());

				profileData = await profilesManager.add({
					name: profile.name,
					encryption: {
						algorithm: 'default',
						salt: bytesToBase64(salt),
						key: encryptedKey,
					},
				});
			}

			await updateProfiles();

			return profileData;
		},
		[profilesManager, updateProfiles],
	);

	return {
		isProfilesLoaded,
		profiles,
		createProfile,
	};
};
