import { webcrypto } from 'node:crypto';

import { getRandomBytes } from '../utils/random';
import { ciphers } from './ciphers';
import { createFakeRandomBytesGenerator } from './random';
import { fromHex, toHex } from './utils';

vi.stubGlobal('crypto', webcrypto);
vi.stubGlobal('self', globalThis);

ciphers.map((cipher) =>
	describe(cipher.name, () => {
		test('Encrypted text may be decrypted', async () => {
			const getRandomBytes = createFakeRandomBytesGenerator(0);
			const key = getRandomBytes(32);
			const codec = await cipher.create(key, getRandomBytes);

			const originalData = getRandomBytes(1024 * 1024);

			const ct = await codec.encrypt(originalData.buffer.slice());
			await expect(
				codec.decrypt(ct).then((buffer) => toHex(new Uint8Array(buffer))),
			).resolves.toBe(toHex(new Uint8Array(originalData.buffer)));
		});

		test('Encrypted text may be decrypted by another instance with the equal key', async () => {
			const pt = getRandomBytes(1000);
			const key = getRandomBytes(32);

			const cipher1 = await cipher.create(key.slice(), getRandomBytes);
			const ct = await cipher1.encrypt(pt.slice().buffer);

			const cipher2 = await cipher.create(key.slice(), getRandomBytes);
			await expect(
				cipher2.decrypt(ct).then((buffer) => Buffer.from(buffer).toString('hex')),
			).resolves.toStrictEqual(Buffer.from(pt.buffer).toString('hex'));
		});

		test('The encryption of same plaintext must return different cipher texts', async () => {
			const key = getRandomBytes(32);
			const codec = await cipher.create(key, getRandomBytes);
			const originalData = getRandomBytes(1024).buffer;

			// All cipher text is unique
			const cipherTexts = new Set<string>();
			for (let i = 0; i < 100; i++) {
				const ct = await codec.encrypt(originalData);
				const ctHex = toHex(new Uint8Array(ct));
				expect(cipherTexts.has(ctHex), 'Each cipher text are unique').toBe(false);

				cipherTexts.add(ctHex);
				expect(cipherTexts.has(ctHex), 'Ensure the cipher text is recorded').toBe(
					true,
				);
			}

			// All cipher texts must be decrypted to a buffer equal to original
			for (const ct of cipherTexts) {
				await expect(codec.decrypt(fromHex(ct).buffer)).resolves.toStrictEqual(
					originalData,
				);
			}
		});

		test('Cipher text must not leak any patterns', async () => {
			const getSeededRandomBytes = createFakeRandomBytesGenerator(0);
			const key = getSeededRandomBytes(32);
			const codec = await cipher.create(key, getSeededRandomBytes);

			// 1. highly repetitive input
			const input = new Uint8Array(10_000).fill(0x41);

			const ct = await codec
				.encrypt(input.buffer)
				.then((buffer) => new Uint8Array(buffer));

			// 2. sliding window duplicate detection
			const window = 8; // small, mode-agnostic
			const seen = new Map<string, number>();

			onTestFailed(() => {
				console.log('Debug information');
				console.log({ key: Buffer.from(key).toString('hex'), window, seen });
				console.log('Cipher text', Buffer.from(ct).toString('hex'));
			});

			for (let i = 0; i <= ct.length - window; i++) {
				const slice = ct.subarray(i, i + window);
				const key = Buffer.from(slice).toString('hex');

				expect(seen.has(key), key).toBe(false);
				seen.set(key, i);
			}

			expect(true).toBe(true);
		});
	}),
);
