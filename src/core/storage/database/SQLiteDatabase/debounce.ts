/* eslint-disable @typescript-eslint/no-use-before-define */
type DebounceOptions = {
	wait: number; // Minimum wait time in milliseconds before invoking the function again
	deadline?: number; // Maximum time in milliseconds to force invocation
};

export function debounce<T extends(...args: any[]) => any>(
	func: T,
	options: DebounceOptions,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
	const { wait, deadline } = options;
	let timerId: ReturnType<typeof setTimeout> | null = null;
	let deadlineTimerId: ReturnType<typeof setTimeout> | null = null;
	let lastCallTime: number | null = null;

	function debouncedFunction(...args: Parameters<T>): void {
		const now = Date.now();

		if (lastCallTime === null) {
			clearTimers();
			func(...args); // Call immediately on first invocation or after wait time has passed
			lastCallTime = now;
		} else {
			if (timerId) {
				clearTimeout(timerId);
			}

			timerId = setTimeout(() => {
				func(...args);
				lastCallTime = Date.now();
				clearTimers();
			}, wait - (now - lastCallTime));
		}

		if (deadline && !deadlineTimerId) {
			deadlineTimerId = setTimeout(() => {
				func(...args);
				lastCallTime = Date.now();
				clearTimers();
			}, deadline);
		}
	}

	debouncedFunction.cancel = () => {
		clearTimers();
		lastCallTime = null;
	};

	function clearTimers(): void {
		if (timerId) {
			clearTimeout(timerId);
			timerId = null;
		}
		if (deadlineTimerId) {
			clearTimeout(deadlineTimerId);
			deadlineTimerId = null;
		}
	}

	return debouncedFunction as typeof debouncedFunction & { cancel: () => void };
}
