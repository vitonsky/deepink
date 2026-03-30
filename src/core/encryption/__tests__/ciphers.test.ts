import { webcrypto } from 'node:crypto';

import { AESGCMCipher } from '../ciphers/AES';
import { SeprentCipher } from '../ciphers/Serpent';
import { WasmTwofishCTRCipher } from '../ciphers/Twofish';
import { getRandomBytes } from '../utils/random';
import { IEncryptionProcessor, RandomBytesGenerator } from '..';

const ciphers: {
	name: string;
	create(
		key: Uint8Array<ArrayBuffer>,
		randomBytes: RandomBytesGenerator,
	): Promise<IEncryptionProcessor>;
}[] = [
	{
		name: 'AES',
		async create(key, randomBytes) {
			const cryptoKey = await self.crypto.subtle.importKey(
				'raw',
				key,
				{
					name: 'AES-GCM',
					length: 256,
				},
				false,
				['encrypt', 'decrypt'],
			);
			return new AESGCMCipher(cryptoKey, randomBytes);
		},
	},
	{
		name: 'Twofish',
		async create(key, randomBytes) {
			return new WasmTwofishCTRCipher(key, randomBytes);
		},
	},
	{
		name: 'Serpent',
		async create(key, randomBytes) {
			return new SeprentCipher(key, randomBytes);
		},
	},
];

vi.stubGlobal('crypto', webcrypto);
vi.stubGlobal('self', globalThis);

function fromHex(str: string) {
	return new Uint8Array(Buffer.from(str, 'hex'));
}

function toHex(buf: Uint8Array) {
	return Buffer.from(buf).toString('hex').toUpperCase();
}

ciphers.map((cipher) =>
	describe(cipher.name, () => {
		test('Encrypted text may be decrypted by another instance', async () => {
			const pt = getRandomBytes(1000);
			const key = getRandomBytes(32);

			const cipher1 = await cipher.create(key, getRandomBytes);
			const ct = await cipher1.encrypt(pt.slice().buffer);

			const cipher2 = await cipher.create(key, getRandomBytes);
			await expect(cipher2.decrypt(ct)).resolves.toStrictEqual(pt.buffer);
		});

		test('Matches reference test vectors', async () => {
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
