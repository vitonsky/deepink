import { useCallback, useEffect, useState } from 'react';
import { createEvent, createStore } from 'effector';
import { useUnit } from 'effector-react';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { bytesToBase64 } from '@core/encryption/utils/encoding';
import { getRandomBytes } from '@core/encryption/utils/random';
import { WorkerEncryptionProxyProcessor } from '@core/features/encryption/workers/WorkerEncryptionProxyProcessor';
import { ProfileObject, ProfilesManager } from '@core/storage/ProfilesManager';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { NewProfile } from '@features/WorkspaceManager/ProfileCreator';

export const createProfilesManagerApi = () => {
	const $profiles = createStore<null | ProfileObject[]>(null);
	const events = {
		profilesUpdated: createEvent<null | ProfileObject[]>(),
	};

	$profiles.on(events.profilesUpdated, (_state, payload) => payload);

	return {
		$profiles,
		events,
	};
};

/**
 * Hook to manage profile accounts
 */
export const useProfilesManager = () => {
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

			// TODO: replace to `createEncryption`
			const workerEncryption = new WorkerEncryptionProxyProcessor(
				profile.password,
				new Uint8Array(salt),
			);
			const encryption = new EncryptionController(workerEncryption);

			const key = getRandomBytes(32);
			const encryptedKey = await encryption.encrypt(key);

			workerEncryption.terminate();

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
