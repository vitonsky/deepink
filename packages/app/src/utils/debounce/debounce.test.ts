import { debounce, DebounceOptions } from './debounce';

describe('Debounce functions basic usage', () => {
	const options = {
		wait: 300,
		deadline: 10000,
		runImmediateFirstCall: true,
	} satisfies DebounceOptions;

	beforeAll(() => {
		vi.useFakeTimers();
	});
	afterAll(() => {
		vi.useRealTimers();
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.clearAllMocks();
	});

	test('call function immediately when queue is empty', () => {
		const callback = vi.fn();
		const debouncedCallback = debounce(callback, options);

		// First call
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);

		// One more call after delay time must be executed immediately
		vi.advanceTimersByTime(options.wait);
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(2);
	});

	test('delay function calls in row', () => {
		const callback = vi.fn();
		const debouncedCallback = debounce(callback, options);

		// First call
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);

		// Delay next calls
		debouncedCallback();
		debouncedCallback();
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(options.wait);
		expect(callback).toHaveBeenCalledTimes(2);

		// Execute call immediately, in case queue is empty
		vi.advanceTimersByTime(options.wait);
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(3);
	});

	test('call function by deadline', () => {
		const callback = vi.fn();
		const debouncedCallback = debounce(callback, options);

		// First call
		debouncedCallback();
		expect(callback).toHaveBeenCalledTimes(1);

		// Delay next calls
		for (let i = 0; i < 100; i++) {
			debouncedCallback();
		}
		expect(callback).toHaveBeenCalledTimes(1);

		// Call by deadline
		const stepTime = options.wait / 2;
		const iterations = Math.ceil(options.deadline / stepTime);
		for (let i = 0; i < iterations; i++) {
			vi.advanceTimersByTime(stepTime);
			debouncedCallback();
		}

		expect(callback).toHaveBeenCalledTimes(2);
	});
});
