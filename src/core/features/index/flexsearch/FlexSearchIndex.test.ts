import { Mock } from 'vitest';
import { Worker } from 'worker_threads';
import { InMemoryFS } from '@core/features/files/InMemoryFS';

import { FlexSearchIndex } from './FlexSearchIndex';

vi.mock('worker_threads', async (importOriginal) => {
	const actual: any = await importOriginal();

	// Don't interfere when running inside a worker thread itself
	if (!actual.isMainThread) return actual;

	const OriginalWorker = actual.Worker;

	class TrackedWorker extends OriginalWorker {
		constructor(...args: any[]) {
			super(...args); // real Worker is spawned here ✅

			// Walk the full prototype chain and spy on every method
			const seen = new Set();
			let proto = Object.getPrototypeOf(this);

			while (proto && proto !== Object.prototype) {
				for (const key of Object.getOwnPropertyNames(proto)) {
					if (
						key !== 'constructor' &&
						!seen.has(key) &&
						typeof this[key] === 'function'
					) {
						vi.spyOn(this, key as any); // wraps real method, still calls through ✅
						seen.add(key);
					}
				}
				proto = Object.getPrototypeOf(proto);
			}

			TrackedWorker.instances.push(this);
		}
	}

	TrackedWorker.instances = [];

	return { ...actual, Worker: TrackedWorker };
});

const SuperWorker = Worker as unknown as Worker & { instances: (Worker & Mock)[] };

beforeEach(() => {
	SuperWorker.instances = []; // reset instance tracking between tests
});

afterEach(async () => {
	// Terminate real workers so threads don't hang
	await Promise.all(SuperWorker.instances.map((w) => w.terminate()));
	vi.restoreAllMocks();
});

describe('Persistence', () => {
	const indexFs = new InMemoryFS();

	test('Fill the index', async () => {
		const index = new FlexSearchIndex(indexFs);
		const session = await index.createIndexSession();

		await Promise.all([
			session.add('foo', 'The foo content'),
			session.add('bar', 'The bar content'),
		]);

		await session.commit();
	});

	test('Search in index in another session', async () => {
		const index = new FlexSearchIndex(indexFs);
		await expect(index.query('FOO CONTENT')).resolves.toEqual(['foo']);
	});

	test('Index are empty after drop the FS', async () => {
		await indexFs.delete(await indexFs.list());
		await expect(indexFs.list()).resolves.toEqual([]);

		const index = new FlexSearchIndex(indexFs);
		await expect(index.query('FOO CONTENT')).resolves.toEqual([]);
	});
});

test('Worker life cycle', async () => {
	const indexFs = new InMemoryFS();
	const index = new FlexSearchIndex(indexFs);

	expect(
		SuperWorker.instances,
		'No instances is created before any action',
	).toHaveLength(0);

	await index.load();
	expect(SuperWorker.instances, 'Worker may be loaded manually').toHaveLength(1);
	expect(SuperWorker.instances[0].terminate).not.toBeCalled();

	await index.unload();
	expect(
		SuperWorker.instances[0].terminate,
		'Worker may be force unloaded',
	).toBeCalled();

	await index.load();
	expect(SuperWorker.instances, 'Worker may be loaded after unload').toHaveLength(2);
	expect(SuperWorker.instances[1].terminate).not.toBeCalled();

	await index.load();
	await index.load();
	await index.load();
	expect(SuperWorker.instances, 'Only one worker at once must be loaded').toHaveLength(
		2,
	);
	expect(SuperWorker.instances[1].terminate).not.toBeCalled();

	const session = await index.createIndexSession();

	await expect(
		Promise.all([
			session.add('foo', 'The foo content'),
			index.unload(),
			session.add('bar', 'The bar content'),
		]),
	).rejects.toThrowError('Worker is unloaded');
});
