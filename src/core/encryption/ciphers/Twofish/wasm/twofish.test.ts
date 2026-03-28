import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getRandomBytes } from '@core/encryption/utils/random';

import testvectors from './testvectors';
import { TwofishModule } from './twofish';
import { TwofishCTRCipher, WasmTwofishCTRCipher } from '..';

const tf = await TwofishModule.load(readFileSync(resolve(__dirname, './twofish.wasm')));

// 128-bit key
const key = new Uint8Array([
	0x9f, 0x58, 0x9f, 0x5c, 0xf6, 0x12, 0x2c, 0x32, 0xb6, 0xbf, 0xec, 0x2f, 0x2a, 0xe8,
	0xc3, 0x5a,
]);

const session = tf.createSession(key);

console.time('The loop');
const plaintext = new Uint8Array([
	0xd4, 0x91, 0xdb, 0x16, 0xe7, 0xb1, 0xc3, 0x9e, 0x86, 0xcb, 0x08, 0x6b, 0x78, 0x9f,
	0x54, 0x19,
]);
for (let i = 0; i < (1024 * 1024) / 16; i++) {
	tf.encrypt(session, plaintext);
}
console.timeEnd('The loop');

tf.destroySession(session);

vi.stubGlobal('crypto', webcrypto);
vi.stubGlobal('self', globalThis);

test.skip('Demo', async () => {
	const key = getRandomBytes(16);
	const session = tf.createSession(new Uint8Array(key));

	const originalData = getRandomBytes(1024 * 1024);

	const ct = tf.encrypt(session, new Uint8Array(originalData));

	await expect(tf.decrypt(session, ct)).resolves.toEqual(originalData);
});

test('Encrypted text may be decrypted', async () => {
	const key = getRandomBytes(32);
	const cipher = new WasmTwofishCTRCipher(key, getRandomBytes);

	const originalData = getRandomBytes(1024 * 1024).buffer;
	const encryptionSubject = originalData.slice();

	console.time('Buffer processing');
	await cipher.encrypt(encryptionSubject);
	console.timeEnd('Buffer processing');

	console.time('Buffer processing');
	const ct = await cipher.encrypt(encryptionSubject);
	console.timeEnd('Buffer processing');

	expect(ct).toBeInstanceOf(ArrayBuffer);
	await expect(cipher.decrypt(ct)).resolves.toEqual(originalData);
});

test('Equality test', async () => {
	const key = getRandomBytes(32);

	const data1 = getRandomBytes(1024 * 1024).buffer.slice();
	const data2 = data1.slice();

	const cipher1 = new WasmTwofishCTRCipher(key, getRandomBytes);
	const cipher2 = new TwofishCTRCipher(key, getRandomBytes);

	const ct1 = await cipher1.encrypt(data1);
	const ct2 = await cipher2.encrypt(data2);

	expect(ct1).toEqual(ct2);
});

function fromHex(str: string) {
	const l = str.length / 2;
	const out = new Uint8Array(l);
	for (let i = 0; i < l; i++) {
		out[i] = parseInt(str.substr(2 * i, 2), 16);
	}
	return out;
}

function toHex(buf: Uint8Array) {
	return [...buf]
		.map((n) => {
			const h = n.toString(16);
			return h.length === 1 ? '0' + h : h;
		})
		.join('')
		.toUpperCase();
}

describe('Test vectors', () => {
	let tf: TwofishModule;
	beforeAll(async () => {
		tf = await TwofishModule.load(readFileSync(resolve(__dirname, './twofish.wasm')));
	});

	testvectors.forEach(({ keysize, tests }) =>
		describe(`Key size ${keysize}`, () => {
			tests.forEach((data) =>
				test(`Encrypt pt=${data.pt} with key=${data.key}`, () => {
					const session = tf.createSession(fromHex(data.key));
					onTestFinished(() => tf.destroySession(session));

					const result = tf.encrypt(session, fromHex(data.pt));
					expect(toHex(result)).toBe(data.ct);
				}),
			);
		}),
	);
});
