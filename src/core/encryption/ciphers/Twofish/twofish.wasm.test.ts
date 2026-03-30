import { webcrypto } from 'node:crypto';

import { getRandomBytes } from '@core/encryption/utils/random';

import { WasmTwofishCTRCipher } from '.';

vi.stubGlobal('crypto', webcrypto);
vi.stubGlobal('self', globalThis);

test('Demo', async () => {
	const pt = getRandomBytes(1000);

	const key = getRandomBytes(32);
	const cipher1 = new WasmTwofishCTRCipher(key, getRandomBytes);
	const ct = await cipher1.encrypt(pt.slice().buffer);

	const cipher2 = new WasmTwofishCTRCipher(key, getRandomBytes);
	await expect(cipher2.decrypt(ct)).resolves.toStrictEqual(pt.buffer);
});
