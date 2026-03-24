import { Index } from 'flexsearch';
import { loadDocs } from 'scripts/datasets/load-bin';
import { bench } from 'vitest';
import { InMemoryFS } from '@core/features/files/InMemoryFS';

import { FlexSearchStorage } from './FlexSearchStorage';

const docs = loadDocs();

function pickRandomWords(docs: string[], n: number): string[] {
	const words: string[] = [];

	for (const doc of docs) {
		words.push(...doc.split(' '));
	}

	// shuffle array
	for (let i = words.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[words[i], words[j]] = [words[j], words[i]];
	}

	return words.slice(0, n);
}

const searchTerms = pickRandomWords(docs.slice(0, 10000), 1000);

function pickRandom<T>(arr: T[]): T | undefined {
	if (arr.length === 0) return undefined;
	const idx = Math.floor(Math.random() * arr.length);
	return arr[idx];
}

describe('InMemory storage (baseline)', () => {
	let currentIndex: Index;
	let docIndex = 0;
	const getDocIndex = () => {
		let index = docIndex++;
		if (index >= docs.length) {
			docIndex = 0;
			index = 0;
		}

		return index;
	};

	bench(
		'Commit for 1k texts',
		async () => {
			for (let i = 0; i < 100; i++) {
				const docIndex = getDocIndex();
				await currentIndex.add(docIndex, docs[docIndex]);
			}
		},
		{
			async setup() {
				const index = new Index({ priority: 9 });
				currentIndex = index;
			},
			iterations: 10,
		},
	);

	bench(
		'Search for one term',
		async () => {
			await currentIndex.search(pickRandom(searchTerms)!);
		},
		{
			throws: true,
			iterations: 10000,
		},
	);

	bench(
		'Find 10 non-empty results',
		async () => {
			for (let count = 0; count >= 10; ) {
				const results = await currentIndex.search(pickRandom(searchTerms)!);
				count += results.length;
			}
		},
		{
			throws: true,
			iterations: 1000,
		},
	);
});

describe('Import/Export', () => {
	let currentIndex: Index;
	let docIndex = 0;
	const getDocIndex = () => {
		let index = docIndex++;
		if (index >= docs.length) {
			docIndex = 0;
			index = 0;
		}

		return index;
	};

	const storage = new InMemoryFS();

	bench(
		'Commit for 1k texts',
		async () => {
			for (let i = 0; i < 100; i++) {
				const docIndex = getDocIndex();
				await currentIndex.add(docIndex, docs[docIndex]);
			}
			await currentIndex.export((key, data) => {
				return storage.write('/' + key, new TextEncoder().encode(data).buffer);
			});
		},
		{
			setup() {
				currentIndex = new Index({ priority: 9 });
			},
			teardown() {
				if (!currentIndex) return;
				currentIndex.cleanup();
				(currentIndex as any) = null;
			},
			iterations: 10,
		},
	);

	bench(
		'Load the data',
		async () => {
			const index = new Index({ priority: 9 });

			// Load the data
			const files = await storage.list();
			await Promise.all(
				files.map(async (file) => {
					const data = await storage.get(file);

					const key = file
						.split('/')
						.find((segment) => segment.trim().length > 0);
					if (key && data) {
						await index.import(key, new TextDecoder().decode(data));
					}
				}),
			);
		},
		{
			teardown() {
				if (!currentIndex) return;
				currentIndex.cleanup();
				(currentIndex as any) = null;
			},
			iterations: 10,
		},
	);

	bench(
		'Search for one term',
		async () => {
			await currentIndex.search(pickRandom(searchTerms)!);
		},
		{
			throws: true,
			async setup() {
				const index = new Index({ priority: 9 });

				// Load the data
				const files = await storage.list();
				await Promise.all(
					files.map(async (file) => {
						const data = await storage.get(file);

						const key = file
							.split('/')
							.find((segment) => segment.trim().length > 0);
						if (key && data) {
							await index.import(key, new TextDecoder().decode(data));
						}
					}),
				);
				currentIndex = index;
			},
			teardown() {
				if (!currentIndex) return;
				currentIndex.cleanup();
				(currentIndex as any) = null;
			},
			iterations: 10000,
		},
	);

	bench(
		'Find 10 non-empty results',
		async () => {
			for (let count = 0; count >= 10; ) {
				const results = await currentIndex.search(pickRandom(searchTerms)!);
				count += results.length;
			}
		},
		{
			throws: true,
			async setup() {
				const index = new Index({ priority: 9 });

				// Load the data
				const files = await storage.list();
				await Promise.all(
					files.map(async (file) => {
						const data = await storage.get(file);

						const key = file
							.split('/')
							.find((segment) => segment.trim().length > 0);
						if (key && data) {
							await index.import(key, new TextDecoder().decode(data));
						}
					}),
				);
				currentIndex = index;
			},
			teardown() {
				if (!currentIndex) return;
				currentIndex.cleanup();
				(currentIndex as any) = null;
			},
			iterations: 1000,
		},
	);
});

describe('FlexSearchStorage', () => {
	let currentIndex: Index;
	let docIndex = 0;
	const getDocIndex = () => {
		let index = docIndex++;
		if (index >= docs.length) {
			docIndex = 0;
			index = 0;
		}

		return index;
	};

	const storage = new InMemoryFS();

	bench(
		'Commit for 1k texts',
		async () => {
			for (let i = 0; i < 100; i++) {
				const docIndex = getDocIndex();
				await currentIndex.add(docIndex, docs[docIndex]);
			}
			await currentIndex.commit();
		},
		{
			async setup() {
				const index = new Index({ priority: 9 });

				// Load the data
				await index.mount(new FlexSearchStorage(storage));
				currentIndex = index;
			},
			async teardown() {
				if (!currentIndex) return;
				await currentIndex.destroy();
				(currentIndex as any) = null;
			},
			iterations: 10,
		},
	);

	bench(
		'Load the data',
		async () => {
			const index = new Index({ priority: 9 });

			// Load the data
			await index.mount(new FlexSearchStorage(storage));
		},
		{
			iterations: 10,
		},
	);

	bench(
		'Search for one term',
		async () => {
			await currentIndex.search(pickRandom(searchTerms)!);
		},
		{
			throws: true,
			async setup() {
				const index = new Index({ priority: 9 });

				// Load the data
				await index.mount(new FlexSearchStorage(storage));
				currentIndex = index;
			},
			async teardown() {
				if (!currentIndex) return;
				await currentIndex.destroy();
				(currentIndex as any) = null;
			},
			iterations: 10000,
		},
	);

	bench(
		'Find 10 non-empty results',
		async () => {
			for (let count = 0; count >= 10; ) {
				const results = await currentIndex.search(pickRandom(searchTerms)!);
				count += results.length;
			}
		},
		{
			throws: true,
			async setup() {
				const index = new Index({ priority: 9 });

				// Load the data
				await index.mount(new FlexSearchStorage(storage));
				currentIndex = index;
			},
			async teardown() {
				if (!currentIndex) return;
				await currentIndex.destroy();
				(currentIndex as any) = null;
			},
			iterations: 1000,
		},
	);
});
