import { debounce } from 'lodash';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { openDatabase, SQLiteDatabase } from './SQLiteDatabase';

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

describe('Database auto synchronization', () => {
	const syncOptions = {
		delay: 30,
		deadline: 120,
	};

	const waitPossibleSync = () => wait(10);

	let writeFnMock: jest.SpyInstance<Promise<void>, [buffer: ArrayBuffer], any>;
	let db: SQLiteDatabase;
	let notes: NotesController;

	afterEach(() => {
		writeFnMock.mockClear();
	});

	test('Sync runs immediately once DB has been opened', async () => {
		const dbFile = createFileControllerMock();

		writeFnMock = jest.spyOn(dbFile, 'write');

		// Open DB
		db = await openDatabase(dbFile, { verbose: false, sync: syncOptions });

		// Check forced sync that has been called while DB opening
		expect(writeFnMock).toBeCalledTimes(1);

		notes = new NotesController(db);
	});

	test('Sync runs for first data mutation', async () => {
		await notes.add({ title: 'Demo title', text: 'Demo text' });
		await waitPossibleSync();
		expect(writeFnMock).toBeCalledTimes(1);
	});

	test('Data changes in row will be delayed', async () => {
		for (
			const startTime = Date.now();
			Date.now() - startTime < syncOptions.delay * 1.5;

		) {
			await notes.add({ title: 'Demo title', text: 'Demo text' });
		}
		expect(writeFnMock).toBeCalledTimes(0);

		await wait(syncOptions.delay);
		expect(writeFnMock).toBeCalledTimes(1);
	});

	test('Data changes in row will be synced by deadline', async () => {
		for (
			const startTime = Date.now();
			Date.now() - startTime < syncOptions.deadline * 1.1;

		) {
			await notes.add({ title: 'Demo title', text: 'Demo text' });
			await waitPossibleSync();
		}
		expect(writeFnMock).toBeCalledTimes(1);

		// One more sync must be called after delay
		writeFnMock.mockClear();
		await wait(syncOptions.delay);
		expect(writeFnMock).toBeCalledTimes(1);
	});

	test('Sync runs while close DB', async () => {
		await db.close();
		expect(writeFnMock).toBeCalledTimes(1);
	});
});
