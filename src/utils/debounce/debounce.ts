/* eslint-disable @typescript-eslint/no-use-before-define */
export type DebounceOptions = {
	wait: number; // Minimum wait time in milliseconds before invoking the function again
	deadline?: number; // Maximum time in milliseconds to force invocation
	runImmediateFirstCall?: boolean;
};

export type DebouncedFn<T extends (...args: any[]) => any> = ((
	...args: Parameters<T>
) => void) & { cancel: () => void };

export function debounce<T extends (...args: any[]) => any>(
	func: T,
	options: DebounceOptions,
): DebouncedFn<T> {
	const { wait, deadline, runImmediateFirstCall } = options;
	let timerId: ReturnType<typeof setTimeout> | null = null;
	let deadlineTimerId: ReturnType<typeof setTimeout> | null = null;
	let lastCallTime: number | null = null;

	let run: (() => void) | null = null;

	function debouncedFunction(...args: Parameters<T>): void {
		// Update task (to update arguments to the latest)
		run = () => {
			lastCallTime = Date.now();
			clearTimers();
			func(...args);
		};

		// Run immediately
		if (runImmediateFirstCall) {
			if (
				lastCallTime === null ||
				(!deadlineTimerId && Date.now() - lastCallTime >= wait)
			) {
				run();
				return;
			}
		}

		// Schedule run
		if (timerId) {
			clearTimeout(timerId);
		}

		timerId = setTimeout(run, wait);

		// Set deadline once
		if (deadline && !deadlineTimerId) {
			deadlineTimerId = setTimeout(() => {
				// Run latest task, instead of task at moment of scheduling time
				if (run) {
					run();
				}
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
