import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { AppVersions } from './AppVersions';

beforeEach(() => {
	vi.clearAllMocks();
});

const stateFile = createFileControllerMock();

test('First used version that is not logged yet must be considered as "just installed"', async () => {
	const versions = new AppVersions('0.0.1', stateFile);

	const onInstalledState = {
		currentVersion: '0.0.1',
		previousVersion: null,
		isJustInstalled: true,
		isVersionUpdated: true,
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
	});
});
