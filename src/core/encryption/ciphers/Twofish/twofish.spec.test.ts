import { getRandomBytes } from '@core/encryption/utils/random';

import { TwofishCTRCipher } from '.';

test('Chunking', async () => {
	const cipher = new TwofishCTRCipher(getRandomBytes(32), getRandomBytes, {
		chunkSize: 16,
	});

	const pt = new Uint8Array(320).buffer;
	const ct = await cipher.encrypt(pt);

	await expect(cipher.decrypt(ct)).resolves.toStrictEqual(pt);
});
