import { createTelemetrySession } from './createTelemetrySession';

vi.mock('electron', () => vi.importActual('@mocks/electron'));

const getDateWithOffset = (hours: number) => {
	const date = new Date();
	date.setHours(date.getHours() + hours);
	return date;
};

const defaultVersionsInfo = {
	currentVersion: '0.0.1',
	previousVersion: null,
	isJustInstalled: true,
	isVersionUpdated: true,
	versions: [],
};

test('Session time must contains seconds from start of session', async () => {
	vi.setSystemTime(100_000);
	const getSessionProps = createTelemetrySession(defaultVersionsInfo);

	await expect(getSessionProps()).resolves.toEqual(
		expect.objectContaining({
			sessionTimeInSeconds: 0,
		}),
	);

	vi.setSystemTime(101_000);
	await expect(getSessionProps()).resolves.toEqual(
		expect.objectContaining({
			sessionTimeInSeconds: 1,
		}),
	);

	vi.setSystemTime(110_000);
	await expect(getSessionProps()).resolves.toEqual(
		expect.objectContaining({
			sessionTimeInSeconds: 10,
		}),
	);
});

test('Install age must be in days', async () => {
	await expect(
		createTelemetrySession({
			currentVersion: '0.0.1',
			previousVersion: null,
			isJustInstalled: true,
			isVersionUpdated: true,
			versions: [],
		})(),
		'0 days for fresh install',
	).resolves.toEqual(
		expect.objectContaining({
			installAgeInDays: 0,
			firstInstallInDays: 0,
		}),
	);

	await expect(
		createTelemetrySession({
			currentVersion: '0.0.1',
			previousVersion: null,
			isJustInstalled: false,
			isVersionUpdated: false,
			versions: [
				{
					installedAt: getDateWithOffset(-20).getTime(),
					version: '0.0.1',
				},
			],
		})(),
		'0 days for app installed few hours ago',
	).resolves.toEqual(
		expect.objectContaining({
			installAgeInDays: 0,
			firstInstallInDays: 0,
		}),
	);

	await expect(
		createTelemetrySession({
			currentVersion: '0.0.1',
			previousVersion: null,
			isJustInstalled: false,
			isVersionUpdated: false,
			versions: [
				{
					installedAt: getDateWithOffset(-48).getTime(),
					version: '0.0.1',
				},
			],
		})(),
		'Time in days',
	).resolves.toEqual(
		expect.objectContaining({
			installAgeInDays: 2,
			firstInstallInDays: 2,
		}),
	);

	await expect(
		createTelemetrySession({
			currentVersion: '0.0.2',
			previousVersion: null,
			isJustInstalled: false,
			isVersionUpdated: false,
			versions: [
				{
					installedAt: getDateWithOffset(-48).getTime(),
					version: '0.0.1',
				},
				{
					installedAt: getDateWithOffset(-24).getTime(),
					version: '0.0.1',
				},
			],
		})(),
		'Time in days',
	).resolves.toEqual(
		expect.objectContaining({
			installAgeInDays: 1,
			firstInstallInDays: 2,
		}),
	);
});

test('Session ID must be persistent per whole session', async () => {
	vi.setSystemTime(100_000);
	const getSessionProps = createTelemetrySession(defaultVersionsInfo);

	const { sessionId } = await getSessionProps();
	expect(sessionId).toBeTypeOf('string');

	await expect(getSessionProps()).resolves.toHaveProperty('sessionId', sessionId);

	vi.setSystemTime(200_000);
	await expect(getSessionProps()).resolves.toHaveProperty('sessionId', sessionId);

	vi.setSystemTime(2_000_000);
	await expect(getSessionProps()).resolves.toHaveProperty('sessionId', sessionId);

	const anotherSessionProps = createTelemetrySession(defaultVersionsInfo)();
	await expect(anotherSessionProps).resolves.toHaveProperty('sessionId');
	await expect(
		anotherSessionProps,
		'New ID for another session',
	).resolves.not.toHaveProperty('sessionId', sessionId);
});
