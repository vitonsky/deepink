import { Plausible, PlausibleInitOptions } from 'plausible-client';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { Telemetry } from './Telemetry';

const dummyPlausibleConfig: PlausibleInitOptions = {
	apiHost: 'https://example.com',
	domain: 'test',
};

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
	vi.clearAllMocks();
	mockFetch.mockImplementation(() => new Response('ok'));
});

describe('Broken state file must be automatically recreated', () => {
	const plausible = new Plausible(dummyPlausibleConfig);

	const onEventSent = vi.fn();
	const telemetryStateFile = createFileControllerMock();
	const telemetry = new Telemetry(telemetryStateFile, plausible, { onEventSent });

	test('Send few requests', async () => {
		expect(onEventSent).toBeCalledTimes(0);

		await telemetry.track('test', { foo: 'Event 1' });
		expect(onEventSent).toBeCalledTimes(1);

		await telemetry.track('test', { foo: 'Event 2' });
		expect(onEventSent).toBeCalledTimes(2);

		await telemetry.track('test', { foo: 'Event 3' });
		expect(onEventSent).toBeCalledTimes(3);

		await expect(telemetry.getState()).resolves.toEqual(
			expect.objectContaining({ uid: expect.any(String), queue: [] }),
		);

		expect(onEventSent).toBeCalledWith(
			expect.objectContaining({
				name: 'test',
				payload: { foo: 'Event 1', uid: expect.any(String) },
			}),
		);
	});

	test('Corrupted state file must be re-created', async () => {
		const { uid } = await telemetry.getState();
		expect(uid.length).toBeGreaterThan(0);

		await telemetryStateFile.write(new Uint8Array(100).buffer);

		const onEventSent = vi.fn();
		const telemetry2 = new Telemetry(telemetryStateFile, plausible, { onEventSent });

		await telemetry2.track('test', { foo: 'Event 1' });
		await telemetry2.track('test', { foo: 'Event 2' });
		await telemetry2.track('test', { foo: 'Event 3' });

		await expect(telemetry2.getState()).resolves.toEqual(
			expect.objectContaining({ uid: expect.not.stringMatching(uid), queue: [] }),
		);

		expect(onEventSent).toBeCalledTimes(3);
	});
});

describe('Failed requests must be accumulated in queue and sent later', () => {
	const plausible = new Plausible(dummyPlausibleConfig);

	const onEventSent = vi.fn();
	const telemetryStateFile = createFileControllerMock();
	const telemetry = new Telemetry(telemetryStateFile, plausible, { onEventSent });

	test('Failed requests must be queued', async () => {
		// Emulate network error
		mockFetch.mockImplementation(
			() => new Response('Error', { status: 500, statusText: 'Error 500' }),
		);

		await telemetry.track('test', { foo: 'Event 1' });
		await telemetry.track('test', { foo: 'Event 2' });

		expect(onEventSent).toBeCalledTimes(0);

		await expect(telemetry.getState()).resolves.toEqual(
			expect.objectContaining({
				queue: [
					{
						name: 'test',
						props: {
							foo: 'Event 1',
							uid: expect.any(String),
						},
					},
					{
						name: 'test',
						props: {
							foo: 'Event 2',
							uid: expect.any(String),
						},
					},
				],
			}),
		);
	});

	test('Resend events', async () => {
		// Emulate network error
		mockFetch.mockImplementation(
			() => new Response('Error', { status: 500, statusText: 'Error 500' }),
		);
		await expect(telemetry.handleQueue()).resolves.toEqual({
			total: 2,
			processed: 0,
		});

		expect(mockFetch.mock.calls).toContainEqual([
			expect.any(String),
			expect.objectContaining({
				body: expect.stringContaining('Event 1'),
			}),
		]);

		await expect(telemetry.getState()).resolves.toEqual(
			expect.objectContaining({ queue: expect.objectContaining({ length: 2 }) }),
		);

		expect(onEventSent).toBeCalledTimes(0);

		// When network restored, queued events must be sent
		mockFetch.mockClear();
		expect(mockFetch).toBeCalledTimes(0);

		mockFetch.mockImplementation(() => new Response('ok'));
		await expect(telemetry.handleQueue()).resolves.toEqual({
			total: 2,
			processed: 2,
		});

		expect(mockFetch.mock.calls).toContainEqual([
			expect.any(String),
			expect.objectContaining({
				body: expect.stringContaining('Event 1'),
			}),
		]);

		await expect(telemetry.getState()).resolves.toEqual(
			expect.objectContaining({ queue: [] }),
		);

		expect(onEventSent).toBeCalledTimes(2);
	});
});
