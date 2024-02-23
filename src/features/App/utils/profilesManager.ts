import { useState } from 'react';
import { createApi, createEffect, createStore } from 'effector';
import { useStore } from 'effector-react';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { WorkerEncryptionProxyProcessor } from '@core/encryption/processors/WorkerEncryptionProxyProcessor';
import { bytesToBase64 } from '@core/encryption/utils/encoding';
import { getRandomBytes } from '@core/encryption/utils/random';
import { ProfileObject, ProfilesManager } from '@core/storage/ProfilesManager';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { NewProfile } from '@features/WorkspaceManager/ProfileCreator';

export const createProfilesManagerApi = (profilesManager: ProfilesManager) => {
	const $profiles = createStore<null | ProfileObject[]>(null);
	const profiles = createApi($profiles, {
		update(_state, payload: null | ProfileObject[]) {
			return payload;
		},
	});

	const createProfileFx = createEffect(async (profile: NewProfile) => {
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
	});

	const updateProfiles = () => profilesManager.getProfiles().then(profiles.update);

	createProfileFx.done.watch(updateProfiles);

	// Init state
	updateProfiles();

	return {
		$profiles,
		createProfile: createProfileFx,
	};
};

/**
 * Hook to manage profile accounts
 */
export const useProfilesManager = () => {
	const [{ $profiles, createProfile }] = useState(() => {
		const profilesManager = new ProfilesManager(
			new ElectronFilesController('/'),
			(profileName) => new ElectronFilesController(`/${profileName}`),
		);

		return createProfilesManagerApi(profilesManager);
	});

	const profiles = useStore($profiles);

	return {
		profiles,
		createProfile,
	};
};
