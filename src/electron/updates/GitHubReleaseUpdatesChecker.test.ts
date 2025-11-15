/* eslint-disable camelcase */
import { z } from 'zod';

import {
	GitHubReleaseUpdatesChecker,
	ReleaseObjectScheme,
} from './GitHubReleaseUpdatesChecker';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

type ResponseScheme = z.TypeOf<typeof ReleaseObjectScheme>[];

const mockVersions = (versions: ResponseScheme) => {
	mockFetch.mockImplementation(
		() => new Response(JSON.stringify(versions), { status: 200 }),
	);
};

beforeEach(() => {
	vi.clearAllMocks();
	mockVersions([]);
});

describe('Updates', () => {
	test('Greater version must be considered as new version', async () => {
		mockVersions([
			{
				html_url: 'https://update-url.com',
				tag_name: 'v2.0.0',
				draft: false,
				prerelease: false,
			},
		]);

		await expect(
			new GitHubReleaseUpdatesChecker({
				owner: 'owner',
				repo: 'repo',
			}).checkForUpdates({ version: '0.0.1' }),
		).resolves.toEqual({
			version: '2.0.0',
			url: 'https://update-url.com',
		});

		await expect(
			new GitHubReleaseUpdatesChecker({
				owner: 'owner',
				repo: 'repo',
			}).checkForUpdates({ version: '1.0.0' }),
		).resolves.toEqual({
			version: '2.0.0',
			url: 'https://update-url.com',
		});

		await expect(
			new GitHubReleaseUpdatesChecker({
				owner: 'owner',
				repo: 'repo',
			}).checkForUpdates({ version: '1.1.1' }),
		).resolves.toEqual({
			version: '2.0.0',
			url: 'https://update-url.com',
		});
	});

	test('Greater pre release version must be considered as new', async () => {
		mockVersions([
			{
				html_url: 'https://update-url.com',
				tag_name: 'v5.0.0-preview.7',
				draft: false,
				prerelease: false,
			},
		]);

		await expect(
			new GitHubReleaseUpdatesChecker({
				owner: 'owner',
				repo: 'repo',
			}).checkForUpdates({ version: '0.0.1' }),
		).resolves.toEqual({
			version: '5.0.0-preview.7',
			url: 'https://update-url.com',
		});

		await expect(
			new GitHubReleaseUpdatesChecker({
				owner: 'owner',
				repo: 'repo',
			}).checkForUpdates({ version: '3.2.1-preview.9' }),
		).resolves.toEqual({
			version: '5.0.0-preview.7',
			url: 'https://update-url.com',
		});
	});
});

describe('No updates cases', () => {
	test('Returns null for empty releases list', async () => {
		mockVersions([]);
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
		mockVersions([
			{
				html_url: 'https://update-url.com',
				tag_name: 'v0.0.1',
				draft: false,
				prerelease: false,
			},
		]);

		await expect(
			new GitHubReleaseUpdatesChecker({
				owner: 'owner',
				repo: 'repo',
			}).checkForUpdates({ version: '0.0.1' }),
		).resolves.toEqual(null);
	});

	test('Returns null for versions that are less than current', async () => {
		mockVersions([
			{
				html_url: 'https://update-url.com',
				tag_name: 'v1.0.0',
				draft: false,
				prerelease: false,
			},
		]);

		await expect(
			new GitHubReleaseUpdatesChecker({
				owner: 'owner',
				repo: 'repo',
			}).checkForUpdates({ version: '2.0.0-preview.7' }),
		).resolves.toEqual(null);

		mockVersions([
			{
				html_url: 'https://update-url.com',
				tag_name: 'v2.0.0-preview.5',
				draft: false,
				prerelease: false,
			},
		]);

		await expect(
			new GitHubReleaseUpdatesChecker({
				owner: 'owner',
				repo: 'repo',
			}).checkForUpdates({ version: '2.0.0-preview.7' }),
		).resolves.toEqual(null);
	});
});
