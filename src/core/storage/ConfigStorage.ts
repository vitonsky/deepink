import { TextEncoder } from 'node:util';

import { IFilesStorage } from '../features/files';

type Config = Record<string, any>;

export class ConfigStorage<T extends Record<string, any> = Config> {
	private filename: string;
	private filesController: IFilesStorage;
	constructor(filename: string, filesController: IFilesStorage) {
		this.filename = filename;
		this.filesController = filesController;
	}

	public async set(key: keyof T, value: T[keyof T]) {
		let json = {} as T;

		// Load actual JSON
		const buffer = await this.filesController.get(this.filename);
		if (buffer) {
			const profilesJson = new TextDecoder().decode(buffer);
			json = JSON.parse(profilesJson);
		}

		json[key] = value;

		const serializedJson = JSON.stringify(json, null, '\t');
		const serializedBuffer = new TextEncoder().encode(serializedJson).buffer;
		await this.filesController.write(this.filename, serializedBuffer);
	}

	public async get(key: string) {
		const buffer = await this.filesController.get(this.filename);
		if (!buffer) return null;

		const profilesJson = new TextDecoder().decode(buffer);
		const json = JSON.parse(profilesJson);
		return key in json ? json[key] : null;
	}
}
