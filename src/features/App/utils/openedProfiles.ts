import { useState } from 'react';
import { createApi, createEffect, createStore } from 'effector';
import { useStore } from 'effector-react';
import path from 'path';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { PlaceholderEncryptionController } from '@core/encryption/PlaceholderEncryptionController';
import { WorkerEncryptionProxyProcessor } from '@core/encryption/processors/WorkerEncryptionProxyProcessor';
import { base64ToBytes } from '@core/encryption/utils/encoding';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { Profile } from '@core/state/profiles';
import { openDatabase } from '@core/storage/database/SQLiteDatabase/SQLiteDatabase';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { getUserDataPath } from '@electron/requests/files/renderer';
import { ElectronFilesController } from '@electron/requests/storage/renderer';
import { DisposableBox } from '@utils/disposable';

import { readFile } from 'fs/promises';
import { decryptKey } from '..';

export const createOpenedProfilesApi = <T extends DisposableBox<unknown>>(
	openProfileHandler: (profileData: {
		profile: ProfileObject;
		password?: string;
	}) => Promise<T>,
) => {
	const $profiles = createStore<T[]>([]);
	const profiles = createApi($profiles, {
		add(state: T[], newProfile: T) {
			return [...state, newProfile];
		},
		delete(state: T[], deletedProfile: T) {
			return state.filter((profile) => profile !== deletedProfile);
		},
	});

	const openProfileFx = createEffect(openProfileHandler);
	openProfileFx.doneData.watch((data) => {
		(profiles.add as unknown as (data: T) => void)(data as T);
	});

	const closeProfile = (profile: T) => {
		if (!profile.isDisposed()) {
			profile.dispose();
		}

		(profiles.delete as unknown as (data: T) => void)(profile);
	};

	return {
		$profiles,
		openProfile: openProfileFx,
		closeProfile,
	};
};

export const useOpenedProfiles = () => {
	const [{ $profiles, ...api }] = useState(() => {
		return createOpenedProfilesApi(async ({ profile, password }) => {
			const cleanups: Array<() => void> = [];

			const profileDir = await getUserDataPath(profile.id);

			// Setup encryption
			let encryption: EncryptionController;
			let encryptionCleanup: null | (() => any) = null;
			if (profile.encryption === null) {
				encryption = new EncryptionController(
					new PlaceholderEncryptionController(),
				);
			} else {
				if (password === undefined)
					throw new TypeError('Empty password for encrypted profile');

				const keyFilePath = path.join(profileDir, 'key');
				const encryptedKeyFile = await readFile(keyFilePath);
				const salt = new Uint8Array(base64ToBytes(profile.encryption.salt));
				const key = await decryptKey(encryptedKeyFile.buffer, password, salt);

				const workerEncryption = new WorkerEncryptionProxyProcessor(key, salt);
				encryptionCleanup = () => workerEncryption.terminate();

				encryption = new EncryptionController(workerEncryption);
			}

			// TODO: replace to files manager
			// Setup DB
			const db = await openDatabase(path.join(profileDir, 'deepink.db'), {
				encryption: encryption,
			});

			// TODO: close DB first and close encryption last
			cleanups.push(() => db.close());

			// Setup files
			// TODO: implement methods to close the objects after use
			const attachmentsRegistry = new AttachmentsController(db);
			const filesController = new ElectronFilesController(
				[profile.id, 'files'].join('/'),
				encryption,
			);
			const filesRegistry = new FilesController(
				db,
				filesController,
				attachmentsRegistry,
			);
			const tagsRegistry = new TagsController(db);
			const notesRegistry = new NotesController(db);

			const profileObject: Profile = {
				id: profile.id,
				name: profile.name,
				isEncrypted: profile.encryption !== null,
			};

			return new DisposableBox(
				{
					db,
					attachmentsRegistry,
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
		});
	});

	const profiles = useStore($profiles);

	return {
		profiles,
		...api,
	};
};
