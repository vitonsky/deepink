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

	const syncOptions = {
		delay: 50,
		deadline: 120,
	};

	test('DB synchronization scheduler', async () => {
		const dbFile = createFileControllerMock();

		const spyWrite = jest.spyOn(dbFile, 'write');

		// Open DB
		const db = await openDatabase(dbFile, { verbose: false, sync: syncOptions });

		// Check forced sync that has been called while DB opening
		expect(spyWrite).toBeCalledTimes(1);

		const tablesList = db.db
			.prepare(`SELECT name FROM main.sqlite_master WHERE type='table'`)
			.all();
		console.warn(tablesList);
		expect(tablesList).toEqual(
			expect.arrayContaining(
				['notes', 'files', 'attachments'].map((name) => ({ name })),
			),
		);

		const notes = new NotesController(db);

		// First data mutation will be synchronized immediately
		spyWrite.mockClear();
		await notes.add({ title: 'Demo title', text: 'Demo text' });
		await wait(10);
		expect(spyWrite).toBeCalledTimes(1);

		// Batch sync calls
		spyWrite.mockClear();
		for (let i = 0; i < 100; i++) {
			await notes.add({ title: 'Demo title', text: 'Demo text' });
		}

		expect(spyWrite).toBeCalledTimes(0);
		await wait(syncOptions.delay);
		expect(spyWrite).toBeCalledTimes(1);

		// Deadline sync
		spyWrite.mockClear();
		for (
			const startTime = Date.now();
			Date.now() - startTime < syncOptions.deadline * 1.1;

		) {
			await notes.add({ title: 'Demo title', text: 'Demo text' });
			await wait(0);
		}
		expect(spyWrite).toBeCalledTimes(1);

		// One more sync must be called after delay
		spyWrite.mockClear();
		await wait(syncOptions.delay);
		expect(spyWrite).toBeCalledTimes(1);

		spyWrite.mockClear();
		await db.close();
		expect(spyWrite).toBeCalledTimes(1);
	}, 10000);
});
