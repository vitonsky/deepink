import { useCallback, useState } from 'react';
import { useUnit } from 'effector-react';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { PlaceholderEncryptionController } from '@core/encryption/PlaceholderEncryptionController';
import { base64ToBytes } from '@core/encryption/utils/encoding';
import { createEncryption } from '@core/features/encryption/createEncryption';
import { FileController } from '@core/features/files/FileController';
import { FileControllerWithEncryption } from '@core/features/files/FileControllerWithEncryption';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import {
	openDatabase,
	SQLiteDatabase,
} from '@core/storage/database/SQLiteDatabase/SQLiteDatabase';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { DisposableBox } from '@utils/disposable';

import { createProfilesApi, ProfileEntry } from './profiles';

export type ProfileContainer = {
	profile: ProfileEntry;
	db: SQLiteDatabase;
	encryptionController: EncryptionController;
};

const decryptKey = async ({
	encryptedKey,
	password,
	salt,
	algorithm,
}: {
	encryptedKey: ArrayBuffer;
	password: string;
	salt: ArrayBuffer;
	algorithm: string;
}) => {
	const encryption = await createEncryption({ key: password, salt, algorithm });
	return encryption
		.getContent()
		.decrypt(encryptedKey)
		.finally(() => {
			encryption.dispose();
		});
};

/**
 * Hook to manage active and opened profiles
 */
export const useProfileContainers = () => {
	const [{ $profiles, $activeProfile, ...api }] = useState(() =>
		createProfilesApi<DisposableBox<ProfileContainer>>(),
	);

	const profiles = useUnit($profiles);
	const activeProfile = useUnit($activeProfile);

	const { profileOpened, activeProfileChanged } = api.events;
	const openProfile = useCallback(
		async (
			{ profile, password }: { profile: ProfileObject; password?: string },
			changeActiveProfile = false,
		) => {
			const cleanups: Array<() => void> = [];

			const profileFilesController = new ElectronFilesController(`/${profile.id}`);

			// Setup encryption
			let encryptionController: EncryptionController;
			let encryptionCleanup: null | (() => any) = null;
			if (profile.encryption === null) {
				encryptionController = new EncryptionController(
					new PlaceholderEncryptionController(),
				);
			} else {
				if (password === undefined)
					throw new TypeError('Empty password for encrypted profile');

				const encryptedKeyBuffer = await profileFilesController.get('key');
				if (!encryptedKeyBuffer) {
					throw new Error('Key file is not found in profile directory');
				}

				const salt = new Uint8Array(base64ToBytes(profile.encryption.salt));
				const key = await decryptKey({
					encryptedKey: encryptedKeyBuffer,
					password: password,
					salt,
					algorithm: profile.encryption.algorithm,
				});

				const encryption = await createEncryption({
					key,
					salt,
					algorithm: profile.encryption.algorithm,
				});

				encryptionCleanup = () => encryption.dispose();
				encryptionController = encryption.getContent();
			}

			// Setup DB
			const db = await openDatabase(
				new FileControllerWithEncryption(
					new FileController('deepink.db', profileFilesController),
					encryptionController,
				),
			);

			// Ensure at least one workspace exists
			const workspaces = new WorkspacesController(db);
			const isWorkspacesExists = await workspaces
				.getList()
				.then((workspaces) => workspaces.length > 0);
			if (!isWorkspacesExists) {
				await workspaces.create({ name: 'Notes' });
			}

			// TODO: close DB first and close encryption last
			cleanups.push(() => db.close());

			const profileObject: ProfileEntry = {
				id: profile.id,
				name: profile.name,
				isEncrypted: profile.encryption !== null,
			};

			const newProfile = new DisposableBox(
				{
					db,
					profile: profileObject,
					encryptionController,
				},
				async () => {
					// TODO: remove key of RAM. Set control with callback to remove key
					for (const cleanup of cleanups) {
						// TODO: set deadline for awaiting
						await cleanup();
					}

					if (encryptionCleanup) {
						encryptionCleanup();
					}
				},
			);

			profileOpened(newProfile);

			if (changeActiveProfile) {
				activeProfileChanged(newProfile);
			}

			return newProfile;
		},
		[activeProfileChanged, profileOpened],
	);

	return {
		activeProfile,
		profiles,
		...api,
		openProfile,
	};
};

export type ProfilesApi = ReturnType<typeof useProfileContainers>;
