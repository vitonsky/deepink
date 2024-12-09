import { debounce } from './debounce';

describe('Debounce functions basic usage', () => {
	const times = {
		wait: 300,
		deadline: 10000,
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
		const debouncedCallback = debounce(callback, times);

		// First call
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);

		// One more call after delay time must be executed immediately
		jest.advanceTimersByTime(times.wait);
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(2);
	});

	test('delay function calls in row', () => {
		const callback = jest.fn();
		const debouncedCallback = debounce(callback, times);

		// First call
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);

		// Delay next calls
		debouncedCallback();
		debouncedCallback();
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);
		jest.advanceTimersByTime(times.wait);
		expect(callback).toHaveBeenCalledTimes(2);

		// Execute call immediately, in case queue is empty
		jest.advanceTimersByTime(times.wait);
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(3);
	});

	test('call function by deadline', () => {
		const callback = jest.fn();
		const debouncedCallback = debounce(callback, times);

		// First call
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);

		// Delay next calls
		for (let i = 0; i < 100; i++) {
			debouncedCallback();
		}
		expect(callback).toHaveBeenCalledTimes(1);

		// Call by deadline
		const stepTime = times.wait / 2;
		const iterations = Math.ceil(times.deadline / stepTime);
		for (let i = 0; i < iterations; i++) {
			jest.advanceTimersByTime(stepTime);
			debouncedCallback();
		}

		expect(callback).toHaveBeenCalledTimes(2);
	});
});
