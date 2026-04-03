import { xor16 } from '../utils/xor';

/**
 * Stream cipher with counter implementation
 * Read more on https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_(CTR)
 * RFC: https://datatracker.ietf.org/doc/html/rfc3686
 */
export class CTRCipherMode {
	constructor(
		private readonly encryptBuffer: (buffer: Uint8Array) => Uint8Array,
		private readonly blockSize = 16,
	) {}

	public async encrypt(buffer: Uint8Array, iv: Uint8Array) {
		if (buffer.byteLength % this.blockSize !== 0)
			throw new TypeError(
				`Buffer size is not multiple to ${this.blockSize}. Did you missed to add padding?`,
			);
		if (iv.byteLength + 4 !== this.blockSize)
			throw new TypeError(
				`Initialization vector have size ${iv.byteLength} bytes + 4 byte for 32bit counter = ${iv.byteLength + 4} byte. It does not match a block size`,
			);

		const out = new Uint8Array(buffer.byteLength);

		// We preallocate the RAM and re-use it,
		// since only one XOR buffer is used at once
		const xorBuffer = new Uint8Array(16);

		// Layout is `nonce || counter`
		const input = new Uint8Array(this.blockSize);
		input.set(iv);

		const counterView = new DataView(input.buffer, this.blockSize - 4);

		const blocksCount = Math.ceil(buffer.byteLength / this.blockSize);
		for (let i = 0; i < blocksCount; ) {
			const offset = i * this.blockSize;

			// Encrypt unique sequence
			const encryptedSequence = this.encryptBuffer(input);

			// TODO: provide an efficient xor function as dependency
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
			counterView.setUint32(0, ++i);
		}

		return out;
	}

	public async decrypt(buffer: Uint8Array, iv: Uint8Array) {
		// CTR mode do the same operation for decryption as for encryption,
		// but instead of plain text it handles cipher text
		return this.encrypt(buffer, iv);
	}
}
