import { xor16 } from '../utils/xor';

/**
 * Stream cipher with counter implementation
 * Read more on https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_(CTR)
 * RFC: https://datatracker.ietf.org/doc/html/rfc3686
 */
export class CTRCipherMode {
	private readonly encryptBuffer;
	private readonly blockSize;
	constructor(encryptBuffer: (buffer: Uint8Array) => Uint8Array, blockSize = 16) {
		this.encryptBuffer = encryptBuffer;
		this.blockSize = blockSize;
	}

	public async encrypt(buffer: Uint8Array, iv: Uint8Array) {
		if (buffer.byteLength % this.blockSize !== 0)
			throw new TypeError(`Buffer size is not multiple to ${this.blockSize}`);
		if (iv.byteLength % this.blockSize !== 0)
			throw new TypeError(
				`Initialization vector size is not multiple to ${this.blockSize} bytes`,
			);

		const counterBuffer = new Uint8Array(this.blockSize);
		const counterView = new DataView(counterBuffer.buffer);

		const out = new Uint8Array(buffer.byteLength);

		// We preallocate the RAM and re-use it,
		// since only one XOR buffer is used at once
		const xorBuffer = new Uint8Array(16);

		for (let offset = 0; offset < buffer.byteLength; offset += this.blockSize) {
			// XOR a Nonce and Counter
			const ivOffset = offset % iv.byteLength;
			// TODO: provide an efficient xor function as dependency
			const uniqueSequence = xor16(
				xorBuffer,
				iv.subarray(ivOffset, ivOffset + this.blockSize),
				counterBuffer,
			);

			// Encrypt unique sequence
			const encryptedSequence = this.encryptBuffer(uniqueSequence);

			// XOR unique sequence and block data,
			// a data is a plain text for encryption and cipher text for decryption
			const dataBlock = xor16(
				xorBuffer,
				encryptedSequence,
				buffer.subarray(offset, offset + this.blockSize),
			);

			// Write block to a out buffer
			out.set(dataBlock, offset);

			// Increment counter
			const nextCounter = counterView.getUint32(0) + 1;
			counterView.setUint32(0, nextCounter);
		}

		return out;
	}

	public async decrypt(buffer: Uint8Array, iv: Uint8Array) {
		// CTR mode do the same operation for decryption as for encryption,
		// but instead of plain text it handles cipher text
		return this.encrypt(buffer, iv);
	}
}
