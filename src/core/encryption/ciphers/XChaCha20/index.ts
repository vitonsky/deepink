/* eslint-disable no-bitwise */

import sodium from 'libsodium-wrappers-sumo';
import { IEncryptionProcessor, RandomBytesGenerator } from '@core/encryption';
import { struct, u32, u64 } from '@core/encryption/utils/bytes/binstruct';
import { BufferCursor } from '@core/encryption/utils/bytes/BufferCursor';

const NONCE_BYTES = 24;
const MAC_BYTES = 16;
const POLY1305_KEY_BYTES = 32;

const ChaChaHeader = struct({
	chunkSize: u32(),
	length: u64(),
});

function deriveChunkNonce(baseNonce: Uint8Array, chunkIndex: number): Uint8Array {
	const nonce = baseNonce.slice();
	// XOR the first 8 bytes with LE64(chunkIndex)
	let idx = chunkIndex;
	for (let i = 0; i < 8; i++) {
		nonce[i] ^= idx & 0xff;
		idx = Math.floor(idx / 256);
	}
	return nonce;
}

function buildChunkAad(isLast: boolean, chunkIndex: number): Uint8Array {
	const aad = new Uint8Array(9);
	aad[0] = isLast ? 1 : 0;
	// Write chunkIndex as LE64 into bytes 1..8
	let idx = chunkIndex;
	for (let i = 1; i <= 8; i++) {
		aad[i] = idx & 0xff;
		idx = Math.floor(idx / 256);
	}
	return aad;
}

function le64(value: number): Uint8Array {
	const buf = new Uint8Array(8);
	let v = value;
	for (let i = 0; i < 8; i++) {
		buf[i] = v & 0xff;
		v = Math.floor(v / 256);
	}
	return buf;
}

function buildMacInput(aad: Uint8Array, ciphertext: Uint8Array): Uint8Array {
	// RFC 8439 §2.8.1: aad || pad16(aad) || ciphertext || pad16(ciphertext) || LE64(|aad|) || LE64(|ciphertext|)
	const aadPad = (16 - (aad.byteLength % 16)) % 16;
	const ctPad = (16 - (ciphertext.byteLength % 16)) % 16;
	const out = new Uint8Array(
		aad.byteLength + aadPad + ciphertext.byteLength + ctPad + 16, // two LE64 lengths
	);
	let offset = 0;
	out.set(aad, offset);
	offset += aad.byteLength + aadPad;
	out.set(ciphertext, offset);
	offset += ciphertext.byteLength + ctPad;
	out.set(le64(aad.byteLength), offset);
	offset += 8;
	out.set(le64(ciphertext.byteLength), offset);
	return out;
}

// TODO: provide custom random generator
export class XChaCha20Cipher implements IEncryptionProcessor {
	private readonly chunkSize;
	constructor(
		private readonly key: Uint8Array,
		private readonly randomBytesGenerator: RandomBytesGenerator,
		readonly config: { chunkSize?: number } = {},
	) {
		this.chunkSize = config.chunkSize ?? 4096;
	}

	public async encrypt(buffer: ArrayBuffer) {
		await sodium.ready;

		const chunksCount = Math.ceil(buffer.byteLength / this.chunkSize);
		const outBuffer = new Uint8Array(
			ChaChaHeader.size + NONCE_BYTES + buffer.byteLength + chunksCount * MAC_BYTES,
		);

		const input = new BufferCursor(buffer);
		const output = new BufferCursor(outBuffer.buffer);

		output.writeBytes(
			ChaChaHeader.encode({
				length: BigInt(buffer.byteLength),
				chunkSize: this.chunkSize,
			}),
		);

		const baseNonce = this.randomBytesGenerator(NONCE_BYTES);
		output.writeBytes(baseNonce);

		let chunkIndex = 0;
		while (true) {
			const chunkBytes = input.readBytes(this.chunkSize);

			if (chunkBytes === null) throw new Error('Unexpected end of input buffer');

			const isLast = input.getRemainingBytes() === 0;
			const nonce = deriveChunkNonce(baseNonce, chunkIndex);

			// Derive Poly1305 one-time key from counter block 0 (RFC 8439 §2.6)
			const keyBlock0 = sodium.crypto_stream_xchacha20_xor_ic(
				new Uint8Array(64),
				nonce,
				0,
				this.key,
			);
			const poly1305Key = keyBlock0.subarray(0, POLY1305_KEY_BYTES);

			// Encrypt with counter starting at 1, skipping the key block
			const ciphertext = sodium.crypto_stream_xchacha20_xor_ic(
				chunkBytes,
				nonce,
				1,
				this.key,
			);

			const aad = buildChunkAad(isLast, chunkIndex);
			const macInput = buildMacInput(aad, ciphertext);
			const tag = sodium.crypto_onetimeauth(macInput, poly1305Key);

			output.writeBytes(ciphertext);
			output.writeBytes(tag);

			if (isLast) break;
			chunkIndex++;
		}

		return outBuffer.buffer;
	}

	public async decrypt(buffer: ArrayBuffer) {
		await sodium.ready;

		const input = new BufferCursor(buffer);

		const metaHeader = input.readBytes(ChaChaHeader.size);
		if (!metaHeader) throw RangeError('Cannot read meta header');
		const meta = ChaChaHeader.decode(metaHeader);

		const baseNonce = input.readBytes(NONCE_BYTES);
		if (!baseNonce || baseNonce.byteLength !== NONCE_BYTES)
			throw new Error('Cannot read nonce');

		const outBuffer = new Uint8Array(Number(meta.length)).buffer;
		const output = new BufferCursor(outBuffer);

		const totalChunks = Math.ceil(Number(meta.length) / meta.chunkSize);

		let chunkIndex = 0;
		while (true) {
			const bytes = input.readBytes(meta.chunkSize + MAC_BYTES);

			if (bytes === null) break;

			if (bytes.byteLength < MAC_BYTES)
				throw new Error('Chunk is too short to contain a MAC tag');

			const ciphertext = bytes.subarray(0, bytes.byteLength - MAC_BYTES);
			const tag = bytes.subarray(bytes.byteLength - MAC_BYTES);

			const isLast = chunkIndex === totalChunks - 1;
			const nonce = deriveChunkNonce(baseNonce, chunkIndex);

			// Derive Poly1305 one-time key from counter block 0 (RFC 8439 §2.6)
			const keyBlock0 = sodium.crypto_stream_xchacha20_xor_ic(
				new Uint8Array(64),
				nonce,
				0,
				this.key,
			);
			const poly1305Key = keyBlock0.subarray(0, POLY1305_KEY_BYTES);

			const aad = buildChunkAad(isLast, chunkIndex);
			const macInput = buildMacInput(aad, ciphertext);

			const valid = sodium.crypto_onetimeauth_verify(tag, macInput, poly1305Key);
			if (!valid) throw new Error(`MAC verification failed on chunk ${chunkIndex}`);

			// Decrypt with counter starting at 1, matching encryption
			const plaintext = sodium.crypto_stream_xchacha20_xor_ic(
				ciphertext,
				nonce,
				1,
				this.key,
			);

			output.writeBytes(plaintext);

			if (isLast) break;
			chunkIndex++;
		}

		return outBuffer.slice(0);
	}
}
