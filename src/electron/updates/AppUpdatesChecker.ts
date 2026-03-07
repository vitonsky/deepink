import semver from 'semver';
import { z } from 'zod';

const VersionObjectScheme = z.object({
	url: z.string(),
	name: z.string(),
	prerelease: z.boolean(),
});

export type VersionObject = z.output<typeof VersionObjectScheme>;

export type AppVersionInfo = {
	version: string;
	url: string;
};

export class AppUpdatesChecker {
	constructor(
		private readonly config: {
			host: string;
		},
	) {}

	public async getUpdate(context: { version: string }): Promise<AppVersionInfo | null> {
		const { host } = this.config;

		try {
			const response = await fetch(new URL('/versions.json', host).toString());
			if (!response.ok) throw new Error(response.statusText);

			const json = await response.json();
			const releases = VersionObjectScheme.array().parse(json);

			const latestRelease = releases[0];
			if (!latestRelease) return null;

			const latestVersion = latestRelease.name.replace(/^v/, '');
			const isNewVersion = semver.gt(latestVersion, context.version);

			return isNewVersion
				? {
						version: latestVersion,
						url: latestRelease.url,
					}
				: null;
		} catch (error) {
			console.error(error);

			return null;
		}
	}
}
