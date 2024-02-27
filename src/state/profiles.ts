import { createContext, useCallback, useState } from 'react';
import { combine, createApi, createEvent, createStore, sample } from 'effector';
import { useUnit } from 'effector-react';
import path from 'path';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { PlaceholderEncryptionController } from '@core/encryption/PlaceholderEncryptionController';
import { base64ToBytes } from '@core/encryption/utils/encoding';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { createEncryption } from '@core/features/encryption/createEncryption';
import { FilesController } from '@core/features/files/FilesController';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { openDatabase } from '@core/storage/database/SQLiteDatabase/SQLiteDatabase';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { getUserDataPath } from '@electron/requests/files/renderer';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { AppContext } from '@features/App';
import { DisposableBox } from '@utils/disposable';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { readFile } from 'fs/promises';

export type Profile = {
	id: string;
	name: string;
	isEncrypted: boolean;
};

const decryptKey = async (
	encryptedKey: ArrayBuffer,
	password: string,
	salt: ArrayBuffer,
) => {
	const encryption = await createEncryption({ key: password, salt });
	return encryption
		.getContent()
		.decrypt(encryptedKey)
		.finally(() => {
			encryption.dispose();
		});
};

// TODO: remove node specific code
// TODO: refactor to use one store and events instead of reducers
export const createProfilesApi = <T extends DisposableBox<unknown>>(
	autoChangeActiveProfile = true,
) => {
	const $activeProfile = createStore<T | null>(null);

	const $profiles = createStore<T[]>([]);
	const profiles = createApi($profiles, {
		add(state: T[], newProfile: T) {
			return [...state, newProfile];
		},
		delete(state: T[], deletedProfile: T) {
			return state.filter((profile) => profile !== deletedProfile);
		},
	});

	const $combinedStore = combine({
		activeProfile: $activeProfile,
		profiles: $profiles,
	});

	const profileOpened = createEvent<T>();
	// Cast type due to bug in types https://github.com/effector/effector/issues/1048
	profileOpened.watch(profiles.add as any);
	$activeProfile.on(profileOpened, (_state, profile) => profile);

	const profileClosed = createEvent<T>();
	// Cast type due to bug in types https://github.com/effector/effector/issues/1048
	profileClosed.watch(profiles.delete as any);

	// Dispose container
	profileClosed.watch((profile) => {
		if (!profile.isDisposed()) {
			profile.dispose();
		}
	});

	// Update active profile
	sample({
		clock: profileClosed,
		source: $combinedStore,
		filter({ activeProfile }, profile) {
			return activeProfile === profile;
		},
		fn({ profiles }, closedProfile) {
			if (!autoChangeActiveProfile) return null;

			return (
				[...profiles].reverse().find((profile) => profile !== closedProfile) ??
				null
			);
		},
		target: $activeProfile,
	});

	const activeProfileChanged = createEvent<T | null>();

	// Set active profile
	sample({
		clock: activeProfileChanged,
		source: $combinedStore,
		filter({ activeProfile, profiles }, profile) {
			if (profile === null) return true;

			return profile !== activeProfile && profiles.includes(profile);
		},
		fn(_state, newActiveProfile) {
			return newActiveProfile;
		},
		target: $activeProfile,
	});

	const activeProfileCloseRequested = createEvent();
	sample({
		clock: activeProfileCloseRequested,
		source: $activeProfile,
	}).watch((activeProfile) => {
		if (activeProfile !== null) {
			profileClosed(activeProfile);
		}
	});

	return {
		$activeProfile,
		$profiles,
		events: {
			activeProfileChanged,
			activeProfileCloseRequested,
			profileOpened,
			profileClosed,
		},
	};
};

/**
 * Hook to manage active and opened profiles
 */
export const useProfiles = () => {
	const [{ $profiles, $activeProfile, ...api }] = useState(() =>
		createProfilesApi<DisposableBox<AppContext>>(),
	);

	const profiles = useUnit($profiles);
	const activeProfile = useUnit($activeProfile);

	const { profileOpened } = api.events;
	const openProfile = useCallback(
		async ({ profile, password }: { profile: ProfileObject; password?: string }) => {
			const cleanups: Array<() => void> = [];

			const profileDir = await getUserDataPath(profile.id);

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

				const keyFilePath = path.join(profileDir, 'key');
				const encryptedKeyFile = await readFile(keyFilePath);
				const salt = new Uint8Array(base64ToBytes(profile.encryption.salt));
				const key = await decryptKey(encryptedKeyFile.buffer, password, salt);

				const encryption = await createEncryption({ key, salt });

				encryptionCleanup = () => encryption.dispose();
				encryptionController = encryption.getContent();
			}

			// TODO: replace to files manager
			// Setup DB
			const db = await openDatabase(path.join(profileDir, 'deepink.db'), {
				encryption: encryptionController,
			});

			// TODO: close DB first and close encryption last
			cleanups.push(() => db.close());

			// Setup files
			// TODO: implement methods to close the objects after use
			const attachmentsController = new AttachmentsController(db);
			const filesController = new ElectronFilesController(
				[profile.id, 'files'].join('/'),
				encryptionController,
			);
			const filesRegistry = new FilesController(
				db,
				filesController,
				attachmentsController,
			);
			const tagsRegistry = new TagsController(db);
			const notesRegistry = new NotesController(db);

			const profileObject: Profile = {
				id: profile.id,
				name: profile.name,
				isEncrypted: profile.encryption !== null,
			};

			const newProfile = new DisposableBox(
				{
					db,
					attachmentsController,
					filesController,
					filesRegistry,
					tagsRegistry,
					notesRegistry,
					profile: profileObject,
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

			return newProfile;
		},
		[profileOpened],
	);

	return {
		activeProfile,
		profiles,
		...api,
		openProfile,
	};
};

export type ProfilesApi = ReturnType<typeof useProfiles>;

export const profilesContext = createContext<ProfilesApi | null>(null);

export const useProfilesContext = createContextGetterHook(profilesContext);
