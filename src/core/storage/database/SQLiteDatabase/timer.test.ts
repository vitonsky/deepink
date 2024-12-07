import { debounce } from 'lodash';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase } from './SQLiteDatabase';

Object.defineProperty(global, 'performance', {
	writable: true,
});

export const wait = (time: number) => new Promise((res) => setTimeout(res, time));

// The purpose of this test is to demonstrate cases and ensure correct behavior
// of scheduler logic, since it based on proper delay implementation.
// It does not matter which implementation for debouncing will be used,
// it must pass all test cases.

// This test does not tests "lodash" or any other third party package,
// but tests the logic of debouncing independent of its implementation.
describe('Sync scheduling with debounce and deadline', () => {
	const times = {
		deadline: 10000,
		delay: 300,
	};

	beforeAll(() => {
		jest.useFakeTimers();
	});
	afterAll(() => {
		jest.useRealTimers();
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.clearAllMocks();
	});

	test('call function immediately when queue is empty', () => {
		const callback = jest.fn();
		const debouncedCallback = debounce(callback, times.delay, {
			leading: true,
			maxWait: times.deadline,
		});

		// First call
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);

		// One more call after delay time must be executed immediately
		jest.advanceTimersByTime(times.delay);
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(2);
	});

	test('delay function calls in row', () => {
		const callback = jest.fn();
		const debouncedCallback = debounce(callback, times.delay, {
			leading: true,
			maxWait: times.deadline,
		});

		// First call
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);

		// Delay next calls
		debouncedCallback();
		debouncedCallback();
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);
		jest.advanceTimersByTime(times.delay);
		expect(callback).toHaveBeenCalledTimes(2);

		// Execute call immediately, in case queue is empty
		jest.advanceTimersByTime(times.delay);
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(3);
	});

	test('call function by deadline', () => {
		const callback = jest.fn();
		const debouncedCallback = debounce(callback, times.delay, {
			leading: true,
			maxWait: times.deadline,
		});

		// First call
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);

		// Delay next calls
		for (let i = 0; i < 100; i++) {
			debouncedCallback();
		}
		expect(callback).toHaveBeenCalledTimes(1);

		// Call by deadline
		const stepTime = times.delay / 2;
		const iterations = Math.ceil(times.deadline / stepTime);
		for (let i = 0; i < iterations; i++) {
			jest.advanceTimersByTime(stepTime);
			debouncedCallback();
		}

		expect(callback).toHaveBeenCalledTimes(2);
	});
});

describe('Database synchronization', () => {
	// beforeAll(() => {
	// 	jest.useFakeTimers();
	// });
	// afterAll(() => {
	// 	jest.useRealTimers();
	// });

	test('DB synchronization scheduler', async () => {
		const dbFile = createFileControllerMock();

		const spyWrite = jest.spyOn(dbFile, 'write');

		// Open DB
		const db = await openDatabase(dbFile, { verbose: false });

		const tablesList = db.db
			.prepare(`SELECT name FROM main.sqlite_master WHERE type='table'`)
			.all();
		console.warn(tablesList);
		expect(tablesList).toEqual(
			expect.arrayContaining(
				['notes', 'files', 'attachments'].map((name) => ({ name })),
			),
		);

		// Check forced sync that has been called while DB opening
		expect(spyWrite).toBeCalledTimes(1);

		const notes = new NotesController(db);

		// First data mutation will be synchronized immediately
		await notes.add({ title: 'Demo title', text: 'Demo text' });
		await wait(50);
		expect(spyWrite).toBeCalledTimes(2);

		// Batch sync calls
		for (let i = 0; i < 100; i++) {
			await notes.add({ title: 'Demo title', text: 'Demo text' });
		}

		await wait(400);
		expect(spyWrite).toBeCalledTimes(3);

		// TODO: implement deadline
		// // Deadline sync
		// for (const startTime = Date.now(); Date.now() - startTime < 6000;) {
		// 	await notes.add({ title: 'Demo title', text: 'Demo text' });
		// }
		// await wait(10);
		// expect(spyWrite).toBeCalledTimes(4);

		await db.close();
	}, 10000);
});
