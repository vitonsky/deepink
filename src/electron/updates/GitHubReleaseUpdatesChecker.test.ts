/* eslint-disable camelcase */
import { z } from 'zod';

import {
	GitHubReleaseUpdatesChecker,
	ReleaseObjectScheme,
} from './GitHubReleaseUpdatesChecker';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

type ResponseScheme = z.TypeOf<typeof ReleaseObjectScheme>[];

beforeEach(() => {
	vi.clearAllMocks();
	mockFetch.mockImplementation(
		() =>
			new Response('[]', {
				status: 200,
				headers: {
					'content-type': 'application/json',
				},
			}),
	);
});

test('Any new release must be considered as new version', async () => {
	mockFetch.mockImplementation(
		() =>
			new Response(
				JSON.stringify([
					{
						html_url: 'https://update-url.com',
						tag_name: 'v1.0.0',
						draft: false,
						prerelease: false,
					},
				] satisfies ResponseScheme),
				{ status: 200 },
			),
	);

	await expect(
		new GitHubReleaseUpdatesChecker({ owner: 'owner', repo: 'repo' }).checkForUpdates(
			{ version: '0.0.1' },
		),
	).resolves.toEqual({
		version: '1.0.0',
		url: 'https://update-url.com',
	});
});

describe('No updates cases', () => {
	test('Returns null for empty releases list', async () => {
		mockFetch.mockImplementation(() => new Response('[]', { status: 200 }));

		await expect(
			new GitHubReleaseUpdatesChecker({
				owner: 'owner',
				repo: 'repo',
			}).checkForUpdates({ version: '0.0.1' }),
		).resolves.toEqual(null);
	});

	test('Returns null for server errors', async () => {
		mockFetch.mockImplementation(
			() =>
				new Response('Server error', { status: 500, statusText: 'Bad request' }),
		);

		await expect(
			new GitHubReleaseUpdatesChecker({
				owner: 'owner',
				repo: 'repo',
			}).checkForUpdates({ version: '0.0.1' }),
		).resolves.toEqual(null);
	});

	test('Returns null for the same version', async () => {
		mockFetch.mockImplementation(
			() =>
				new Response(
					JSON.stringify([
						{
							html_url: 'https://update-url.com',
							tag_name: 'v0.0.1',
							draft: false,
							prerelease: false,
						},
					] satisfies ResponseScheme),
					{ status: 200 },
				),
		);

		await expect(
			new GitHubReleaseUpdatesChecker({
				owner: 'owner',
				repo: 'repo',
			}).checkForUpdates({ version: '0.0.1' }),
		).resolves.toEqual(null);
	});
});
