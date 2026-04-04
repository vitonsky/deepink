/**
 * Stream cipher with counter implementation
 * Read more on https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_(CTR)
 * RFC: https://datatracker.ietf.org/doc/html/rfc3686
 */
export class CTRCipherMode {
	constructor(
		private readonly encryptBuffer: (buffer: Uint8Array) => Uint8Array,
		private readonly xor: (a: Uint8Array, b: Uint8Array) => Uint8Array,
		private readonly blockSize = 16,
	) {}

	public static getEncryptionLimits(blockSize: number) {
		// We use 4 bytes counter that is 32 bits
		const counterStates = 2 ** 32;
		return {
			maxBlocks: counterStates,
			maxBytes: counterStates * blockSize - 1,
		};
	}

	public async encrypt(buffer: Uint8Array, iv: Uint8Array) {
		if (buffer.byteLength % this.blockSize !== 0)
			throw new TypeError(
				`Buffer size ${buffer.byteLength} bytes is not multiple to ${this.blockSize}. Did you mean to add padding?`,
			);

		const limits = CTRCipherMode.getEncryptionLimits(this.blockSize);

		// (2**32 * 16) / (1024 ** 3) = 64Gb is a total size may be encrypted with block size = 16
		// Next blocks would repeat the sequence, so we cannot allow to continue
		if (buffer.byteLength > limits.maxBytes)
			throw new RangeError(
				`Buffer size ${buffer.byteLength} is out of bytes length that may be encrypted safely via 4bytes counter (${limits.maxBytes})`,
			);

		if (iv.byteLength + 4 < this.blockSize)
			throw new TypeError(
				`Initialization vector have only ${iv.byteLength} bytes. It is too small and must be at least ${this.blockSize - 4}`,
			);

		const out = new Uint8Array(buffer.byteLength);

		// Layout is `nonce || counter`
		const input = new Uint8Array(this.blockSize);
		input.set(iv.slice(0, this.blockSize - 4));

		const counterView = new DataView(input.buffer, this.blockSize - 4);

		const blocksCount = Math.ceil(buffer.byteLength / this.blockSize);
		for (let i = 0; i < blocksCount; ) {
			const offset = i * this.blockSize;

			// Encrypt unique sequence
			const encryptedSequence = this.encryptBuffer(input);

			// TODO: provide an efficient xor function as dependency
			// XOR unique sequence and block data,
			// a data is a plain text for encryption and cipher text for decryption
			const dataBlock = this.xor(
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
