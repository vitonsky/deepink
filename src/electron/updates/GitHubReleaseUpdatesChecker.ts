/* eslint-disable camelcase */
import semver from 'semver';
import { z } from 'zod';

export type AppVersionInfo = {
	version: string;
	url: string;
};

export const ReleaseObjectScheme = z.object({
	html_url: z.string(),
	tag_name: z.string(),

	prerelease: z.boolean(),
	draft: z.boolean(),
});

export class GitHubReleaseUpdatesChecker {
	constructor(
		private readonly config: {
			owner: string;
			repo: string;
		},
	) {}

	public async checkForUpdates(context: {
		version: string;
	}): Promise<AppVersionInfo | null> {
		const { owner, repo } = this.config;

		try {
			const response = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/releases`,
			);
			if (!response.ok) throw new Error(response.statusText);

			const releases = ReleaseObjectScheme.array().parse(await response.json());

			const latestRelease = releases[0];
			if (!latestRelease) return null;

			const latestVersion = latestRelease.tag_name.replace(/^v/, '');
			const isNewVersion = semver.gt(latestVersion, context.version);

			return isNewVersion
				? {
						version: latestVersion,
						url: latestRelease.html_url,
					}
				: null;
		} catch (error) {
			console.error(error);

			return null;
		}
	}
}
