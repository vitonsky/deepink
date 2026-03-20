import { InMemoryFS } from '@core/features/files/InMemoryFS';

import { FlexSearchIndex } from './FlexSearchIndex';

// Mock worker
const OriginalWorker = Worker;
class TrackedWorker extends OriginalWorker {
	public static instances: Worker[] = [];
	constructor(scriptURL: string | URL, options?: WorkerOptions) {
		super(scriptURL, options);

		// Walk the full prototype chain and spy on every method
		const seen = new Set();
		let proto = Object.getPrototypeOf(this);

		while (proto && proto !== Object.prototype) {
			for (const key of Object.getOwnPropertyNames(proto)) {
				if (
					key !== 'constructor' &&
					!seen.has(key) &&
					typeof (this as any)[key] === 'function'
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

globalThis.Worker = TrackedWorker;

beforeEach(() => {
	TrackedWorker.instances = []; // reset instance tracking between tests
});

afterEach(async () => {
	// Terminate real workers so threads don't hang
	await Promise.all(TrackedWorker.instances.map((w) => w.terminate()));
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
		TrackedWorker.instances,
		'No instances is created before any action',
	).toHaveLength(0);

	await index.load();
	expect(TrackedWorker.instances, 'Worker may be loaded manually').toHaveLength(1);
	expect(TrackedWorker.instances[0].terminate).not.toHaveBeenCalled();

	await index.unload();
	expect(
		TrackedWorker.instances[0].terminate,
		'Worker may be force unloaded',
	).toHaveBeenCalled();

	await index.load();
	expect(TrackedWorker.instances, 'Worker may be loaded after unload').toHaveLength(2);
	expect(TrackedWorker.instances[1].terminate).not.toHaveBeenCalled();

	await index.load();
	await index.load();
	await index.load();
	expect(
		TrackedWorker.instances,
		'Only one worker at once must be loaded',
	).toHaveLength(2);
	expect(TrackedWorker.instances[1].terminate).not.toHaveBeenCalled();

	const session = await index.createIndexSession();

	await expect(
		Promise.all([
			session.add('foo', 'The foo content'),
			index.unload(),
			session.add('bar', 'The bar content'),
		]),
	).rejects.toThrow('Worker is unloaded');

	expect(
		TrackedWorker.instances,
		'Only one worker at once must be loaded',
	).toHaveLength(2);
	expect(TrackedWorker.instances[1].terminate).toHaveBeenCalled();
}, 1300);
