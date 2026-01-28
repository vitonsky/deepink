/**
 * Worker created by a bundler
 */
export type ManagedWorker = {
	new (options?: WorkerOptions): Worker;
	prototype: Worker;
};

/**
 * Mock object, that represent a `Worker` created by bundler.
 * This object must be exported from a worker file as a **default export**, to ensure correct types while export from a file
 */
export const FakeWorkerObject = {} as ManagedWorker;
