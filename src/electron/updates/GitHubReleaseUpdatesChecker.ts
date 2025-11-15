/* eslint-disable camelcase */
import { z } from 'zod';

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

	public async checkForUpdates(context: { version: string }) {
		const { owner, repo } = this.config;

		try {
			const response = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/releases`,
			);
			if (!response.ok) throw new Error(response.statusText);

			const releases = ReleaseObjectScheme.array().parse(await response.json());

			if (releases.length === 0) return null;

			const latestRelease = releases[0];
			const latestVersion = latestRelease.tag_name.replace(/^v/, '');
			const isNewVersion = latestVersion !== context.version;

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
