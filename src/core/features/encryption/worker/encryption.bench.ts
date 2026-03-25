import { bench } from 'vitest';

import { ENCRYPTION_ALGORITHM_OPTIONS } from '../algorithms';
import { WorkerEncryptionProcessor } from './WorkerEncryptionProcessor';

describe(`Encrypt 1k chars`, () => {
	ENCRYPTION_ALGORITHM_OPTIONS.map((algorithm) => {
		let processor: WorkerEncryptionProcessor;
		bench(
			algorithm,
			async () => {
				await processor.encrypt(
					new TextEncoder().encode('X'.repeat(1_000)).buffer,
				);
			},
			{
				async setup() {
					processor = new WorkerEncryptionProcessor({
						key: 'secret password',
						salt: new ArrayBuffer(100),
						algorithm,
						disablePulse: true,
					});
					await processor.load();
				},
				async teardown() {
					await processor.terminate();
				},
				iterations: 30,
			},
		);
	});
});

describe(`Encrypt 10k chars`, () => {
	ENCRYPTION_ALGORITHM_OPTIONS.map((algorithm) => {
		let processor: WorkerEncryptionProcessor;
		bench(
			algorithm,
			async () => {
				await processor.encrypt(
					new TextEncoder().encode('X'.repeat(10_000)).buffer,
				);
			},
			{
				async setup() {
					processor = new WorkerEncryptionProcessor({
						key: 'secret password',
						salt: new ArrayBuffer(100),
						algorithm,
						disablePulse: true,
					});
					await processor.load();
				},
				async teardown() {
					await processor.terminate();
				},
				iterations: 30,
			},
		);
	});
});

describe(`Encrypt 100k chars`, () => {
	ENCRYPTION_ALGORITHM_OPTIONS.map((algorithm) => {
		let processor: WorkerEncryptionProcessor;
		bench(
			algorithm,
			async () => {
				await processor.encrypt(
					new TextEncoder().encode('X'.repeat(100_000)).buffer,
				);
			},
			{
				async setup() {
					processor = new WorkerEncryptionProcessor({
						key: 'secret password',
						salt: new ArrayBuffer(100),
						algorithm,
						disablePulse: true,
					});
					await processor.load();
				},
				async teardown() {
					await processor.terminate();
				},
				iterations: 10,
			},
		);
	});
});

describe(`Encrypt 1m chars`, () => {
	ENCRYPTION_ALGORITHM_OPTIONS.map((algorithm) => {
		let processor: WorkerEncryptionProcessor;
		bench(
			algorithm,
			async () => {
				await processor.encrypt(
					new TextEncoder().encode('X'.repeat(1_000_000)).buffer,
				);
			},
			{
				async setup() {
					processor = new WorkerEncryptionProcessor({
						key: 'secret password',
						salt: new ArrayBuffer(100),
						algorithm,
						disablePulse: true,
					});
					await processor.load();
				},
				async teardown() {
					await processor.terminate();
				},
				iterations: 10,
			},
		);
	});
});
