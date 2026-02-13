// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { wait } from '@utils/time';

import { useService } from './useService';

vi.useFakeTimers();

const createService = (time: { init: number; abortion: number }) => {
	const state: string[] = [];
	const service = async () => {
		state.push('init');

		await wait(time.init);
		state.push('started');

		return async () => {
			state.push('abortion');

			await wait(time.abortion);
			state.push('completed');
		};
	};

	return {
		service,
		state,
	};
};

test('New service must wait completion of previous one', async () => {
	const {
		result: { current: runService },
	} = renderHook(useService);

	const serviceStates: ReturnType<typeof createService>[] = [];
	for (let i = 0; i < 30; i++) {
		const service = createService({ init: 100, abortion: 100 });
		serviceStates.push(service);

		const cleanup = runService(service.service);
		await vi.advanceTimersByTimeAsync(30);
		cleanup();
	}

	await vi.advanceTimersByTimeAsync(1000);

	expect(serviceStates.map((service) => service.state)).toMatchSnapshot(
		'Intermediate runs must be skipped. Service that have been started, bust be completed.',
	);
});

test('First and last service runs always completes', async () => {
	const {
		result: { current: runService },
	} = renderHook(useService);

	// Start service
	const firstService = createService({ init: 3000, abortion: 100 });
	const cleanup = runService(firstService.service);

	await vi.advanceTimersByTimeAsync(50);
	expect(firstService.state).toEqual(['init']);
	cleanup();

	// Start new services
	const serviceStates: string[][] = [];
	for (let i = 0; i < 100; i++) {
		const service = createService({ init: 100, abortion: 100 });
		serviceStates.push(service.state);

		const cleanup = runService(service.service);
		await vi.advanceTimersByTimeAsync(10);
		cleanup();
	}

	await vi.advanceTimersByTimeAsync(5000);
	expect(firstService.state, 'First service is completed successfully').toEqual([
		'init',
		'started',
		'abortion',
		'completed',
	]);
	expect(
		serviceStates.slice(0, 99),
		'Intermediate service runs have been skipped',
	).toEqual(Array(99).fill([]));

	expect(serviceStates.at(-1), 'Last service have been completed successfully').toEqual(
		['init', 'started', 'abortion', 'completed'],
	);
});

test('Life cycle callback must be called', async () => {
	const {
		result: { current: runService },
	} = renderHook(useService);

	const onStarted = vi.fn();
	const onCompleted = vi.fn();

	const service = createService({ init: 100, abortion: 100 });
	const cleanup = runService(service.service, { onStarted, onCompleted });

	await vi.advanceTimersByTimeAsync(50);
	expect(service.state).toEqual(['init']);
	expect(onStarted).toBeCalledTimes(1);
	expect(onCompleted).toBeCalledTimes(0);

	await vi.advanceTimersByTimeAsync(50);
	expect(service.state).toEqual(['init', 'started']);

	// Cleanup
	cleanup();
	await vi.advanceTimersByTimeAsync(50);
	expect(service.state).toEqual(['init', 'started', 'abortion']);
	expect(onCompleted).toBeCalledTimes(0);

	await vi.advanceTimersByTimeAsync(50);
	expect(service.state).toEqual(['init', 'started', 'abortion', 'completed']);
	expect(onCompleted).toBeCalledTimes(1);
	expect(onCompleted).toHaveBeenLastCalledWith('stopped');
});
