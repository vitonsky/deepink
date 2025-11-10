import { z } from 'zod';

import { IFileController } from '../files';
import { StateFile } from './StateFile';

const AppVersionScheme = z.object({
	version: z.string(),
	installedAt: z.number(),
});

export type VersionInfo = z.TypeOf<typeof AppVersionScheme>;

export type VersionsSummary = {
	versions: VersionInfo[];
	previousVersion: VersionInfo | null;
	currentVersion: string;
	isJustInstalled: boolean;
	isVersionUpdated: boolean;
};

export class AppVersions {
	private readonly stateFile;
	constructor(private readonly currentVersion: string, file: IFileController) {
		this.stateFile = new StateFile(file, AppVersionScheme.array(), {
			defaultValue: [],
		});
	}

	public async getInfo(): Promise<VersionsSummary> {
		const versions = await this.stateFile.get();

		const lastLoggedVersion = versions.length === 0 ? null : versions.slice(-1)[0];
		const previousVersion =
			versions.findLast(({ version }) => version !== this.currentVersion) ?? null;

		return {
			versions,
			currentVersion: this.currentVersion,
			previousVersion,
			isJustInstalled: lastLoggedVersion === null,
			isVersionUpdated:
				lastLoggedVersion === null ||
				lastLoggedVersion.version !== this.currentVersion,
		};
	}

	public async logVersion() {
		const versions = await this.stateFile.get();

		const lastLoggedVersion = versions.length === 0 ? null : versions.slice(-1)[0];
		if (lastLoggedVersion && lastLoggedVersion.version === this.currentVersion)
			return;

		await this.stateFile.set([
			...versions,
			{ version: this.currentVersion, installedAt: Date.now() },
		]);
	}
}
