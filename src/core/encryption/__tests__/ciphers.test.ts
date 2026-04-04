/* eslint-disable no-bitwise */
import { webcrypto } from 'node:crypto';

import { AESGCMCipher } from '../ciphers/AES';
import { SeprentCipher } from '../ciphers/Serpent';
import { WasmTwofishCTRCipher } from '../ciphers/Twofish';
import { XChaCha20Cipher } from '../ciphers/XChaCha20';
import { BufferIntegrityProcessor } from '../processors/BufferIntegrityProcessor';
import { PipelineProcessor } from '../processors/PipelineProcessor';
import { getDerivedKeysManager, getMasterKey } from '../utils/keys';
import { getRandomBytes } from '../utils/random';
import { IEncryptionProcessor, RandomBytesGenerator } from '..';

function mulberry32(seed: number): () => number {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

const createFakeRandomBytesGenerator = (seed: number) => {
	const getNextNumber = mulberry32(seed);
	return (length: number) => new Uint8Array(length).map(() => getNextNumber() * 100);
};

describe('Fake random', () => {
	test('mulberry32 sequence', () => {
		const seq1 = mulberry32(0);
		expect(
			Array(10)
				.values()
				.map(() => seq1())
				.toArray(),
		).toMatchSnapshot('Seed 0');

		const seq2 = mulberry32(1);
		expect(
			Array(10)
				.values()
				.map(() => seq2())
				.toArray(),
		).toMatchSnapshot('Seed 1');
	});

	test('random bytes sequence', () => {
		expect(
			Buffer.from(createFakeRandomBytesGenerator(0)(10)).toString('hex'),
		).toMatchSnapshot('Seed 0');
		expect(
			Buffer.from(createFakeRandomBytesGenerator(1)(10)).toString('hex'),
		).toMatchSnapshot('Seed 1');
		expect(
			Buffer.from(createFakeRandomBytesGenerator(100)(10)).toString('hex'),
		).toMatchSnapshot('Seed 100');
	});
});

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
	{
		name: 'XChaCha20',
		async create(key, randomBytes) {
			return new XChaCha20Cipher(key, randomBytes);
		},
	},
	{
		name: 'AES-Twofish-Serpent',
		async create(key, randomBytes) {
			const salt = new Uint8Array(32);
			const derivedKeys = await getMasterKey(key.buffer, salt.buffer).then(
				(masterKey) => getDerivedKeysManager(masterKey, salt),
			);

			return new PipelineProcessor([
				new BufferIntegrityProcessor(),
				...(await Promise.all([
					derivedKeys
						.getDerivedKey('AES', {
							name: 'AES-GCM',
							length: 256,
						})
						.then((key) => new AESGCMCipher(key, randomBytes)),
					derivedKeys
						.getDerivedBytes('Twofish', 32 * 8)
						.then(
							(key) =>
								new WasmTwofishCTRCipher(
									new Uint8Array(key),
									randomBytes,
								),
						),
					derivedKeys
						.getDerivedBytes('Serpent', 32 * 8)
						.then(
							(key) => new SeprentCipher(new Uint8Array(key), randomBytes),
						),
				])),
			]);
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

		test('Encrypted text may be decrypted by another instance', async () => {
			const pt = getRandomBytes(1000);
			const key = getRandomBytes(32);

			const cipher1 = await cipher.create(key, getRandomBytes);
			const ct = await cipher1.encrypt(pt.slice().buffer);

			const cipher2 = await cipher.create(key, getRandomBytes);
			await expect(cipher2.decrypt(ct)).resolves.toStrictEqual(pt.buffer);
		});

		test('Messages is not equal to each other', async () => {
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

		test('Must not leak patterns', async () => {
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

		// Verify vectors only for ciphers, not its combinations
		if (['AES', 'Twofish', 'Serpent'].includes(cipher.name)) {
			test.skip('Matches reference test vectors', async () => {
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
		}
	}),
);
