import { wait } from '@utils/time';
import { DebouncedPromises } from './DebouncedPromises';

vi.useFakeTimers();

test('The result of all intermediate calls is the same as for current promise', async () => {
	const executor = new DebouncedPromises();

	const calls: number[] = [];
	const createAsyncCall = (id: number) => async () => {
		calls.push(id);
		await wait(10);
		return id;
	};

	const promises = Promise.all(
		Array(100)
			.fill(null)
			.map((_, index) => executor.add(createAsyncCall(index + 1))),
	);

	await vi.waitUntil(() => promises);

	await expect(promises).resolves.toEqual([...Array(99).fill(1), 100]);
	expect(calls).toEqual([1, 100]);
}, 3_000);

test('All promises in group must be rejected if current promise rejects', async () => {
	const unhandledRejectionListener = vi.fn();
	process.on('unhandledRejection', unhandledRejectionListener);
	onTestFinished(() => {
		process.off('unhandledRejection', unhandledRejectionListener);
	});

	const executor = new DebouncedPromises();

	const results = Promise.allSettled([
		executor.add(async () => {
			await wait(10);
			throw new Error(`Error #1`);
		}),
		executor.add(async () => {
			await wait(10);
			throw new Error(`Error #2`);
		}),
		executor.add(async () => {
			await wait(10);
			return 'Success #3';
		}),
		executor.add(async () => {
			await wait(10);
			return 'Success #4';
		}),
	]);

	await vi.advanceTimersByTimeAsync(100);
	await vi.waitUntil(() => results);

	await expect(results).resolves.toEqual([
		{
			reason: expect.objectContaining({
				message: 'Error #1',
			}),
			status: 'rejected',
		},
		{
			reason: expect.objectContaining({
				message: 'Error #1',
			}),
			status: 'rejected',
		},
		{
			reason: expect.objectContaining({
				message: 'Error #1',
			}),
			status: 'rejected',
		},
		{
			value: 'Success #4',
			status: 'fulfilled',
		},
	]);
}, 3_000);
