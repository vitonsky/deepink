/* eslint-disable @cspell/spellchecker */
/* eslint-disable no-bitwise */
import { describe, expect, it } from 'vitest';

import { xor16 } from '../utils/xor';
import { CTRCipherMode } from './CTRCipherMode';

const makeXorEncrypt =
	(key: number) =>
	(buffer: Uint8Array): Uint8Array =>
		new Uint8Array(buffer.map((b) => b ^ key));

// We preallocate the RAM and re-use it,
// since only one XOR buffer is used at once,
// and we synchronously read the result before run next XOR
const xorBuffer = new Uint8Array(16);
const xor = (a: Uint8Array, b: Uint8Array) => xor16(xorBuffer, a, b);

describe('CTRCipherMode', () => {
	it('output length equals input length', async () => {
		const ctr = new CTRCipherMode(makeXorEncrypt(0xab), xor);
		const iv = new Uint8Array(16).fill(0x00);
		const plaintext = new Uint8Array(32).fill(0x42);
		const ciphertext = await ctr.encrypt(plaintext, iv);
		expect(ciphertext.length).toBe(32);
	});

	it('encrypt is its own inverse (decrypt = encrypt)', async () => {
		const ctr = new CTRCipherMode(makeXorEncrypt(0xab), xor);
		const iv = new Uint8Array(16).fill(0x00);
		const plaintext = new Uint8Array(32).fill(0x42);
		const ciphertext = await ctr.encrypt(plaintext, iv);
		const recovered = await ctr.encrypt(ciphertext, iv);
		expect(recovered).toEqual(plaintext);
	});

	it('different IVs produce different ciphertexts', async () => {
		const ctr = new CTRCipherMode(makeXorEncrypt(0xab), xor);
		const plaintext = new Uint8Array(16).fill(0x42);
		const ct1 = await ctr.encrypt(plaintext, new Uint8Array(16).fill(0x00));
		const ct2 = await ctr.encrypt(plaintext, new Uint8Array(16).fill(0x01));
		expect(ct1).not.toEqual(ct2);
	});

	it('does not mutate the IV', async () => {
		const ctr = new CTRCipherMode(makeXorEncrypt(0xab), xor);
		const iv = new Uint8Array(16).fill(0x00);
		const ivCopy = new Uint8Array(iv);
		await ctr.encrypt(new Uint8Array(48).fill(0x42), iv);
		expect(iv).toEqual(ivCopy);
	});

	it('does not mutate the plaintext', async () => {
		const ctr = new CTRCipherMode(makeXorEncrypt(0xab), xor);
		const iv = new Uint8Array(16).fill(0x00);
		const plaintext = new Uint8Array(48).fill(0x42);
		const snapshot = new Uint8Array(plaintext);
		await ctr.encrypt(plaintext, iv);
		expect(plaintext).toEqual(snapshot);
	});

	it('handles empty input', async () => {
		const ctr = new CTRCipherMode(makeXorEncrypt(0xab), xor);
		const iv = new Uint8Array(16).fill(0x00);
		const result = await ctr.encrypt(new Uint8Array(0), iv);
		expect(result.length).toBe(0);
	});
});

// identity encrypt + zero plaintext → ciphertext = raw counter blocks
const identityEncrypt = (buffer: Uint8Array): Uint8Array => new Uint8Array(buffer);

// const makeXorEncrypt = (key: number) =>
//     async (buffer: Uint8Array): Promise<Uint8Array> =>
//         new Uint8Array(buffer.map((b) => b ^ key));

describe('CTRCipherMode – cryptographic correctness', () => {
	it('ciphertext equals plaintext XOR keystream', async () => {
		const ctr = new CTRCipherMode(makeXorEncrypt(0xab), xor);
		const iv = new Uint8Array(16).fill(0x00);

		// encrypting zeros gives raw keystream (0 XOR KS = KS)
		const keystream = await ctr.encrypt(new Uint8Array(32).fill(0x00), iv);
		const plaintext = new Uint8Array(32).map((_, i) => i);
		const ciphertext = await ctr.encrypt(plaintext, iv);

		const expected = new Uint8Array(plaintext.map((b, i) => b ^ keystream[i]));
		expect(ciphertext).toEqual(expected);
	});

	it('each block is encrypted with a unique counter', async () => {
		const ctr = new CTRCipherMode(identityEncrypt, xor);
		const iv = new Uint8Array(16).fill(0x00);

		const ciphertext = await ctr.encrypt(new Uint8Array(48).fill(0x00), iv);
		const block0 = ciphertext.slice(0, 16);
		const block1 = ciphertext.slice(16, 32);
		const block2 = ciphertext.slice(32, 48);

		expect(block0).not.toEqual(block1);
		expect(block1).not.toEqual(block2);
	});

	it('counter increments consistently between blocks', async () => {
		const ctr = new CTRCipherMode(identityEncrypt, xor);
		const iv = new Uint8Array(16).fill(0x00);

		const ciphertext = await ctr.encrypt(new Uint8Array(48).fill(0x00), iv);
		const block0 = Array.from(ciphertext.slice(0, 16));
		const block1 = Array.from(ciphertext.slice(16, 32));
		const block2 = Array.from(ciphertext.slice(32, 48));

		const diff01 = block1.map((b, i) => b - block0[i]);
		const diff12 = block2.map((b, i) => b - block1[i]);

		// same increment pattern each time, and it must actually change
		expect(diff01).toEqual(diff12);
		expect(diff01.some((d) => d !== 0)).toBe(true);
	});

	it.todo('partial last block uses only the required keystream bytes', async () => {
		const ctr = new CTRCipherMode(identityEncrypt, xor);
		const iv = new Uint8Array(16).fill(0x00);

		const partial = await ctr.encrypt(new Uint8Array(19).fill(0x00), iv);
		const full = await ctr.encrypt(new Uint8Array(32).fill(0x00), iv);

		// bytes must match the full encryption and length must not be padded
		expect(partial).toEqual(full.slice(0, 19));
		expect(partial.length).toBe(19);
	});

	it('keystream is consistent regardless of message length', async () => {
		const ctr = new CTRCipherMode(makeXorEncrypt(0x42), xor);
		const iv = new Uint8Array(16).fill(0x00);
		const plaintext = new Uint8Array(48).fill(0xaa);

		const full = await ctr.encrypt(plaintext, iv);
		const firstBlock = await ctr.encrypt(plaintext.slice(0, 16), iv);

		// first block of a long message must equal a standalone single-block encryption
		expect(full.slice(0, 16)).toEqual(firstBlock);
	});
});
