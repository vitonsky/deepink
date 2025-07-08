import { TextEncoder } from 'node:util';

import { EncryptionAlgorithm } from '@core/features/encryption/algorithms';

import { IFilesStorage } from '../features/files';

export type ProfileObject = {
	id: string;
	name: string;
	encryption: null | {
		algorithm: EncryptionAlgorithm;
		salt: string;
		key: ArrayBuffer;
	};
};

// TODO: implement delete method
// TODO: implement update method
export class ProfilesManager {
	private filesController: IFilesStorage;
	private getProfileFilesController;
	constructor(
		filesController: IFilesStorage,
		getProfileFilesController: (profileName: string) => IFilesStorage,
	) {
		this.filesController = filesController;
		this.getProfileFilesController = getProfileFilesController;
	}

	public async getProfiles(): Promise<ProfileObject[]> {
		const buffer = await this.filesController.get('profiles.json');
		if (!buffer) return [];

		try {
			const profilesJson = new TextDecoder().decode(buffer);
			return JSON.parse(profilesJson);
		} catch (err) {
			console.error(err);
			return [];
		}
	}

	public async add(
		profileData: Pick<ProfileObject, 'name' | 'encryption'>,
	): Promise<ProfileObject> {
		const profiles = await this.getProfiles();

		const newProfile: ProfileObject = {
			...profileData,
			id: self.crypto.randomUUID(),
		};

		profiles.push(newProfile);

		const serializedProfiles = JSON.stringify(profiles);
		const buffer = new TextEncoder().encode(serializedProfiles);
		await this.filesController.write('profiles.json', buffer);

		// Write key
		if (profileData.encryption) {
			const profileFiles = this.getProfileFilesController(newProfile.id);
			await profileFiles.write('key', profileData.encryption.key);
		}

		return newProfile;
	}

	public async get(id: string): Promise<ProfileObject | null> {
		const profiles = await this.getProfiles();
		return profiles.find((profile) => profile.id === id) ?? null;
	}
}
