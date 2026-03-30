import { webcrypto } from 'node:crypto';

import { getRandomBytes } from '@core/encryption/utils/random';

import { SeprentCipher } from '.';

vi.stubGlobal('crypto', webcrypto);
vi.stubGlobal('self', globalThis);

test('Encrypted text may be decrypted', async () => {
	const key = getRandomBytes(32);
	const cipher = new SeprentCipher(key);

	const originalData = getRandomBytes(1024 * 1024).buffer;

	const ct = await cipher.encrypt(originalData);
	expect(ct).toBeInstanceOf(ArrayBuffer);

	await expect(cipher.decrypt(ct)).resolves.toStrictEqual(originalData);
});

test('Messages is not equal to each other', async () => {
	const key = getRandomBytes(32);
	const cipher = new SeprentCipher(key);
	const originalData = getRandomBytes(1024).buffer;

	// All cipher text is unique
	const cipherTexts = new Set<ArrayBuffer>();
	for (let i = 0; i < 100; i++) {
		const ct = await cipher.encrypt(originalData);
		expect(cipherTexts.has(ct), 'Each cipher text are unique').toBe(false);

		cipherTexts.add(ct);
		expect(cipherTexts.has(ct), 'Ensure the cipher text is recorded').toBe(true);
	}

	// All cipher texts is equal after decryption
	for (const ct of cipherTexts) {
		await expect(cipher.decrypt(ct)).resolves.toStrictEqual(originalData);
	}
});
