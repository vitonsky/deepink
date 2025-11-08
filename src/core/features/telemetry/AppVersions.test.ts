import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { AppVersions, VersionsSummary } from './AppVersions';

beforeEach(() => {
	vi.clearAllMocks();
});

const stateFile = createFileControllerMock();

test('First used version that is not logged yet must be considered as "just installed"', async () => {
	const versions = new AppVersions('0.0.1', stateFile);

	const onInstalledState: VersionsSummary = {
		currentVersion: '0.0.1',
		previousVersion: null,
		isJustInstalled: true,
		isVersionUpdated: true,
		versions: [],
	};

	await expect(versions.getInfo()).resolves.toEqual(onInstalledState);
	await expect(versions.getInfo(), 'Versions info are idempotent').resolves.toEqual(
		onInstalledState,
	);
	await expect(versions.getInfo(), 'Versions info are idempotent').resolves.toEqual(
		onInstalledState,
	);
});

test('Logged version must not be considered as update', async () => {
	const versions = new AppVersions('0.0.1', stateFile);

	await versions.logVersion();
	await expect(versions.getInfo()).resolves.toEqual({
		currentVersion: '0.0.1',
		previousVersion: null,
		isJustInstalled: false,
		isVersionUpdated: false,
		versions: [
			{
				installedAt: expect.any(Number),
				version: '0.0.1',
			},
		],
	});
});

test('New version must be considered as update', async () => {
	const versions = new AppVersions('0.0.2', stateFile);

	await expect(versions.getInfo()).resolves.toEqual({
		currentVersion: '0.0.2',
		previousVersion: {
			installedAt: expect.any(Number),
			version: '0.0.1',
		},
		isJustInstalled: false,
		isVersionUpdated: true,
		versions: [
			{
				installedAt: expect.any(Number),
				version: '0.0.1',
			},
		],
	});

	await versions.logVersion();
	await expect(versions.getInfo()).resolves.toEqual({
		currentVersion: '0.0.2',
		previousVersion: {
			installedAt: expect.any(Number),
			version: '0.0.1',
		},
		isJustInstalled: false,
		isVersionUpdated: false,
		versions: [
			{
				installedAt: expect.any(Number),
				version: '0.0.1',
			},
			{
				installedAt: expect.any(Number),
				version: '0.0.2',
			},
		],
	});
});

test('Downgrade must be considered as update', async () => {
	const versions = new AppVersions('0.0.1', stateFile);

	await expect(versions.getInfo()).resolves.toEqual({
		currentVersion: '0.0.1',
		previousVersion: {
			installedAt: expect.any(Number),
			version: '0.0.2',
		},
		isJustInstalled: false,
		isVersionUpdated: true,
		versions: [
			{
				installedAt: expect.any(Number),
				version: '0.0.1',
			},
			{
				installedAt: expect.any(Number),
				version: '0.0.2',
			},
		],
	});

	await versions.logVersion();
	await expect(versions.getInfo()).resolves.toEqual({
		currentVersion: '0.0.1',
		previousVersion: {
			installedAt: expect.any(Number),
			version: '0.0.2',
		},
		isJustInstalled: false,
		isVersionUpdated: false,
		versions: [
			{
				installedAt: expect.any(Number),
				version: '0.0.1',
			},
			{
				installedAt: expect.any(Number),
				version: '0.0.2',
			},
			{
				installedAt: expect.any(Number),
				version: '0.0.1',
			},
		],
	});
});
