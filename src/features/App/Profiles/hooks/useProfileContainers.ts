import { useCallback, useState } from 'react';
import { useUnit } from 'effector-react';
import { ManagedDatabase } from '@core/database/ManagedDatabase';
import { SQLiteDB } from '@core/database/sqlite';
import { openSQLite } from '@core/database/sqlite/openSQLite';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { PlaceholderEncryptionController } from '@core/encryption/PlaceholderEncryptionController';
import { base64ToBytes } from '@core/encryption/utils/encoding';
import { deriveBitsFromPassword, KEY_SALT_BYTES } from '@core/encryption/utils/keys';
import { createEncryption } from '@core/features/encryption/createEncryption';
import { IFilesStorage } from '@core/features/files';
import { EncryptedFS } from '@core/features/files/EncryptedFS';
import { FileController } from '@core/features/files/FileController';
import { RootedFS } from '@core/features/files/RootedFS';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { useFilesStorage } from '@features/files';
import { DisposableBox } from '@utils/disposable';

import { createProfilesApi, ProfileEntry } from './profiles';

export type ProfileContainer = {
	profile: ProfileEntry;
	db: ManagedDatabase<SQLiteDB>;
	encryptionController: EncryptionController;
	files: IFilesStorage;
};

const decryptKey = async ({
	encryptedKey,
	password,
	salt,
	algorithm,
}: {
	encryptedKey: ArrayBuffer;
	password: string;
	salt: Uint8Array<ArrayBuffer>;
	algorithm: string;
}) => {
	const keyPassword = await deriveBitsFromPassword(password, salt);
	const encryption = await createEncryption({
		key: keyPassword,
		salt: new Uint8Array(encryptedKey).slice(0, KEY_SALT_BYTES),
		algorithm,
	});

	return encryption
		.getContent()
		.decrypt(encryptedKey.slice(KEY_SALT_BYTES))
		.finally(() => {
			encryption.dispose();
		})
		.then((buffer) => new Uint8Array(buffer));
};

export const enum ProfileOpenErrorCode {
	INCORRECT_PASSWORD = 'INCORRECT_PASSWORD',
}
export class ProfileOpenError extends Error {
	constructor(
		message: string,
		public readonly code: ProfileOpenErrorCode,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = 'ProfileOpenError';
	}
}

// TODO: cover with tests to ensure we can decrypt exists vault
/**
 * Hook to manage active and opened profiles
 */
export const useProfileContainers = () => {
	const [{ $profiles, $activeProfile, ...api }] = useState(() =>
		createProfilesApi<DisposableBox<ProfileContainer>>(),
	);

	const profiles = useUnit($profiles);
	const activeProfile = useUnit($activeProfile);

	const files = useFilesStorage();

	const { profileOpened, activeProfileChanged } = api.events;
	const openProfile = useCallback(
		async (
			{ profile, password }: { profile: ProfileObject; password?: string },
			changeActiveProfile = false,
		) => {
			const cleanups: (() => void)[] = [];

			const runCleanups = async () => {
				// TODO: remove key of RAM. Set control with callback to remove key
				for (const cleanup of cleanups) {
					// TODO: set deadline for awaiting

					await cleanup();
				}
			};

			try {
				const profileFilesController = new RootedFS(
					files,
					`/vaults/${profile.id}`,
				);

				// Setup encryption
				let encryptionController: EncryptionController;

				if (profile.encryption === null) {
					encryptionController = new EncryptionController(
						new PlaceholderEncryptionController(),
					);
				} else {
					if (password === undefined)
						throw new ProfileOpenError(
							'Empty password for encrypted profile',
							ProfileOpenErrorCode.INCORRECT_PASSWORD,
						);

					const encryptedKeyBuffer = await profileFilesController.get('key');
					if (!encryptedKeyBuffer) {
						throw new Error('Key file is not found in profile directory');
					}

					const salt = new Uint8Array(base64ToBytes(profile.encryption.salt));
					let key: ArrayBuffer;
					try {
						key = await decryptKey({
							encryptedKey: encryptedKeyBuffer,
							password,
							salt,
							algorithm: profile.encryption.algorithm,
						});
					} catch (error) {
						throw new ProfileOpenError(
							'Failed to decrypt the key',
							ProfileOpenErrorCode.INCORRECT_PASSWORD,
							{ cause: error },
						);
					}

					const encryption = await createEncryption({
						key,
						salt: new Uint8Array(encryptedKeyBuffer).slice(KEY_SALT_BYTES),
						algorithm: profile.encryption.algorithm,
					});

					cleanups.push(() => encryption.dispose());
					encryptionController = encryption.getContent();
				}

				const encryptedProfileFS = new EncryptedFS(
					profileFilesController,
					encryptionController,
				);

				// Setup DB
				const db = await openSQLite(
					new FileController('vault.db', encryptedProfileFS),
				);

				// TODO: close DB first and close encryption last
				cleanups.unshift(() => db.close());

				// Ensure at least one workspace exists
				const workspaces = new WorkspacesController(db);
				const isWorkspacesExists = await workspaces
					.getList()
					.then((workspaces) => workspaces.length > 0);
				if (!isWorkspacesExists) {
					await workspaces.create({ name: 'Notes' });

					// Sync to avoid losing the default workspace if the app closes before the automatic sync
					await db.sync();
				}

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
						files: encryptedProfileFS,
					} satisfies ProfileContainer,
					runCleanups,
				);

				profileOpened(newProfile);

				if (changeActiveProfile) {
					activeProfileChanged(newProfile);
				}

				return newProfile;
			} catch (error) {
				// Close all resources if opening the profile fails
				await runCleanups();

				throw error;
			}
		},
		[activeProfileChanged, files, profileOpened],
	);

	return {
		activeProfile,
		profiles,
		...api,
		openProfile,
	};
};

export type ProfilesApi = ReturnType<typeof useProfileContainers>;
