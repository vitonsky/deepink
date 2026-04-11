import { AppUpdatesChecker, VersionObject } from '../AppUpdatesChecker';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const mockVersions = (versions: VersionObject[]) => {
	mockFetch.mockImplementation(
		() => new Response(JSON.stringify(versions), { status: 200 }),
	);
};

beforeEach(() => {
	vi.clearAllMocks();
	mockVersions([]);
});

describe('Updates', () => {
	const updatesChecker = new AppUpdatesChecker({ host: 'https://site.com' });

	test('Greater version must be considered as new version', async () => {
		mockVersions([
			{
				url: 'https://update-url.com',
				name: 'v2.0.0',
				prerelease: false,
			},
		]);

		await expect(
			updatesChecker.getUpdate({
				version: '0.0.1',
			}),
		).resolves.toEqual({
			version: '2.0.0',
			url: 'https://update-url.com',
		});

		await expect(
			updatesChecker.getUpdate({
				version: '1.0.0',
			}),
		).resolves.toEqual({
			version: '2.0.0',
			url: 'https://update-url.com',
		});

		await expect(
			updatesChecker.getUpdate({
				version: '1.1.1',
			}),
		).resolves.toEqual({
			version: '2.0.0',
			url: 'https://update-url.com',
		});
	});

	test('Greater pre release version must be considered as new', async () => {
		mockVersions([
			{
				url: 'https://update-url.com',
				name: 'v5.0.0-preview.7',
				prerelease: false,
			},
		]);

		await expect(
			updatesChecker.getUpdate({
				version: '0.0.1',
			}),
		).resolves.toEqual({
			version: '5.0.0-preview.7',
			url: 'https://update-url.com',
		});

		await expect(
			updatesChecker.getUpdate({
				version: '3.2.1-preview.9',
			}),
		).resolves.toEqual({
			version: '5.0.0-preview.7',
			url: 'https://update-url.com',
		});
	});

	test('Latest valid version must be found', async () => {
		mockVersions([
			{
				url: 'https://update-url.com',
				name: 'invalid version',
				prerelease: false,
			},
			{
				url: 'https://update-url.com',
				name: '0.0.3',
				prerelease: false,
			},
			{
				url: 'https://update-url.com',
				name: '0.0.2',
				prerelease: false,
			},
		]);

		await expect(
			updatesChecker.getUpdate({
				version: '0.0.1-preview.1',
			}),
		).resolves.toEqual({
			version: '0.0.3',
			url: 'https://update-url.com',
		});
	});
});

describe('No updates cases', () => {
	const updatesChecker = new AppUpdatesChecker({ host: 'https://site.com' });

	test('Returns null for empty releases list', async () => {
		mockVersions([]);
		await expect(
			updatesChecker.getUpdate({
				version: '0.0.1',
			}),
		).resolves.toEqual(null);
	});

	test('Returns null for server errors', async () => {
		mockFetch.mockImplementation(
			() =>
				new Response('Server error', { status: 500, statusText: 'Bad request' }),
		);

		await expect(
			updatesChecker.getUpdate({
				version: '0.0.1',
			}),
		).resolves.toEqual(null);
	});

	test('Returns null for the same version', async () => {
		mockVersions([
			{
				url: 'https://update-url.com',
				name: 'v0.0.1',
				prerelease: false,
			},
		]);

		await expect(
			updatesChecker.getUpdate({
				version: '0.0.1',
			}),
		).resolves.toEqual(null);
	});

	test('Returns null for versions that are less than current', async () => {
		mockVersions([
			{
				url: 'https://update-url.com',
				name: 'v1.0.0',
				prerelease: false,
			},
		]);

		await expect(
			updatesChecker.getUpdate({
				version: '2.0.0-preview.7',
			}),
		).resolves.toEqual(null);

		mockVersions([
			{
				url: 'https://update-url.com',
				name: 'v2.0.0-preview.5',
				prerelease: false,
			},
		]);

		await expect(
			updatesChecker.getUpdate({
				version: '2.0.0-preview.7',
			}),
		).resolves.toEqual(null);
	});

	test('Invalid versions must be ignored', async () => {
		mockVersions([
			{
				url: 'https://update-url.com',
				name: 'invalid version',
				prerelease: false,
			},
		]);

		await expect(
			updatesChecker.getUpdate({
				version: '0.0.1-preview.1',
			}),
		).resolves.toEqual(null);

		mockVersions([
			{
				url: 'https://update-url.com',
				name: 'invalid version',
				prerelease: false,
			},
			{
				url: 'https://update-url.com',
				name: '0.0.1-preview.1',
				prerelease: false,
			},
		]);

		await expect(
			updatesChecker.getUpdate({
				version: '0.0.1-preview.1',
			}),
		).resolves.toEqual(null);
	});
});
