/* eslint-disable no-bitwise */
import { webcrypto } from 'node:crypto';

import { createFakeRandomBytesGenerator } from '../__tests__/random';
import { getRandomBytes } from '../utils/random';
import { BufferIntegrityProcessor, IntegrityError } from './BufferIntegrityProcessor';

vi.stubGlobal('crypto', webcrypto);
vi.stubGlobal('self', globalThis);

test('Valid data must be successfully verified', async () => {
	const key = getRandomBytes(32);
	const integrity = new BufferIntegrityProcessor(key);

	const data = getRandomBytes(1024);
	const dataHex = Buffer.from(data).toString('hex');
	const blob = await integrity.encrypt(data.buffer);
	await expect(
		integrity.decrypt(blob).then((buffer) => Buffer.from(buffer).toString('hex')),
	).resolves.toBe(dataHex);
});

test('Modified data must throw error', async () => {
	const key = getRandomBytes(32);
	const integrity = new BufferIntegrityProcessor(key);

	const data = getRandomBytes(1024);
	const blob = await integrity.encrypt(data.buffer);

	const blobView = new Uint8Array(blob);
	blobView[blobView.length - 1] = blobView.at(-1)! ^ 1;

	const assert = expect(integrity.decrypt(blob));
	assert.rejects.toThrow(IntegrityError);
	assert.rejects.toThrow('Integrity violation');
});

test('Valid data must throw error with invalid key', async () => {
	const key1 = getRandomBytes(32);
	const key2 = getRandomBytes(32);

	const data = getRandomBytes(1024);
	const blob = await new BufferIntegrityProcessor(key1).encrypt(data.buffer);

	const assert = expect(new BufferIntegrityProcessor(key2).decrypt(blob));
	assert.rejects.toThrow(IntegrityError);
	assert.rejects.toThrow('Integrity violation');
});

test('Error must be thrown when key of invalid size is provided', async () => {
	await expect(
		new BufferIntegrityProcessor(getRandomBytes(0)).encrypt(
			getRandomBytes(1024).buffer,
		),
	).rejects.toThrow('Zero-length key is not supported');

	for (const length of [1, 31, 33, 64, 128, 1000]) {
		await expect(
			new BufferIntegrityProcessor(getRandomBytes(length)).encrypt(
				getRandomBytes(32).buffer,
			),
		).rejects.toThrow('Invalid key length');
	}
});

test('The HMAC output must match a snapshot', async () => {
	const getPseudoRandomBytes = createFakeRandomBytesGenerator(0);

	const key = getPseudoRandomBytes(32);
	const integrity = new BufferIntegrityProcessor(key);

	const data = getPseudoRandomBytes(128);
	const dataHex = Buffer.from(data).toString('hex');

	await expect(
		integrity
			.encrypt(data.buffer)
			.then((buffer) => Buffer.from(buffer).toString('hex')),
	).resolves.toMatchSnapshot(dataHex);
});
