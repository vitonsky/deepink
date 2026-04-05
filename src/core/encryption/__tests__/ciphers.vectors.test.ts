import { webcrypto } from 'node:crypto';

import { ENCRYPTION_ALGORITHM } from '@core/features/encryption';

import { ciphers } from './ciphers';
import { fromHex, toHex } from './utils';

vi.stubGlobal('crypto', webcrypto);
vi.stubGlobal('self', globalThis);

const targetCiphers = new Set<string>([
	ENCRYPTION_ALGORITHM.AES,
	ENCRYPTION_ALGORITHM.TWOFISH,
	ENCRYPTION_ALGORITHM.SERPENT,
]);

ciphers
	.filter((cipher) => targetCiphers.has(cipher.name))
	.map((cipher) =>
		describe(cipher.name, () => {
			test('Cipher must match reference test vectors cascade', async () => {
				// We disable any random factor for that test
				const randomBytesMock = (len: number) => new Uint8Array(len);

				const keySize = 32;
				let key = fromHex('00000000000000000000000000000000');
				let pt = fromHex('00000000000000000000000000000000').buffer;

				for (let i = 1; i <= 10; i++) {
					const cipher1 = await cipher.create(key, randomBytesMock);
					const ct1 = await cipher1.encrypt(pt);
					expect({
						key: toHex(key),
						pt: toHex(new Uint8Array(pt)),
						ct: toHex(new Uint8Array(ct1)),
					}).toMatchSnapshot();

					pt = ct1;

					const cipher2 = await cipher.create(key, randomBytesMock);
					const ct2 = await cipher2.encrypt(pt);
					expect({
						key: toHex(key),
						pt: toHex(new Uint8Array(pt)),
						ct: toHex(new Uint8Array(ct2)),
					}).toMatchSnapshot();

					// We take only last N bytes to use it as a valid key
					key = new Uint8Array(ct1).slice(-keySize);
					pt = ct2;
				}
			});
		}),
	);
