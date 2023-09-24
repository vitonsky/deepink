import { existsSync, mkdirSync } from 'fs';
import path from 'path';

import { getUserDataPath } from '../../electron/requests/files/renderer';

import { bytesToBase64 } from '../encryption/utils/encoding';
import { getRandomBytes } from '../encryption/utils/random';
import { readFile, writeFile } from 'fs/promises';

export type ProfileObject = {
	id: string;
	name: string;
	encryption: null | {
		algorithm: string;
		salt: string;
	};
};

// TODO: implement delete method
// TODO: implement update method
export class ProfilesManager {
	public async getProfiles(): Promise<ProfileObject[]> {
		const userDataDir = await getUserDataPath();

		// Ensure profile dir exists
		mkdirSync(userDataDir, { recursive: true });

		const profilesListPath = path.join(userDataDir, 'profiles.json');

		if (!existsSync(profilesListPath)) return [];

		const profilesFile = await readFile(profilesListPath);
		try {
			const profilesRaw = profilesFile.toString('utf8');
			return JSON.parse(profilesRaw);
		} catch (err) {
			console.error(err);
			return [];
		}
	}

	public async add(profile: { name: string }): Promise<ProfileObject> {
		const profiles = await this.getProfiles();

		const newProfile: ProfileObject = {
			id: self.crypto.randomUUID(),
			name: profile.name,
			encryption: {
				algorithm: 'default',
				salt: bytesToBase64(getRandomBytes(96)),
			},
		};

		profiles.push(newProfile);

		const stringifiedData = JSON.stringify(profiles);

		const profilesListPath = await getUserDataPath('profiles.json');
		await writeFile(profilesListPath, stringifiedData);

		return newProfile;
	}

	public async get(id: string): Promise<ProfileObject | null> {
		const profiles = await this.getProfiles();
		return profiles.find((profile) => profile.id === id) ?? null;
	}
}
