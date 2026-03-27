import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getRandomBytes } from '@core/encryption/utils/random';

import { TwofishModule } from './twofish';
import { WasmTwofishCTRCipher } from '..';

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
	const cipher = new WasmTwofishCTRCipher(new Uint8Array(key), getRandomBytes);

	const originalData = getRandomBytes(1024 * 1024);

	await cipher.encrypt(originalData);
	const ct = await cipher.encrypt(originalData);
	expect(ct).toBeInstanceOf(ArrayBuffer);

	await expect(cipher.decrypt(ct)).resolves.toEqual(originalData);
});
