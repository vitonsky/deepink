import { xor } from '../utils/xor';

export class CTRCipherMode {
	private readonly encryptBuffer;
	private readonly blockSize;
	constructor(
		encryptBuffer: (buffer: ArrayBuffer) => Promise<ArrayBuffer>,
		blockSize = 16,
	) {
		this.encryptBuffer = encryptBuffer;
		this.blockSize = blockSize;
	}

	public async encrypt(buffer: ArrayBuffer, iv: ArrayBuffer) {
		if (buffer.byteLength % this.blockSize !== 0)
			throw new TypeError(`Buffer size is not multiple to ${this.blockSize}`);
		if (iv.byteLength % this.blockSize !== 0)
			throw new TypeError(
				`Initialization vector size is not multiple to ${this.blockSize} bytes`,
			);

		const counterBuffer = new Uint8Array(this.blockSize);
		const counterView = new DataView(counterBuffer.buffer);
		const ivView = new Uint8Array(iv);

		const out = new Uint8Array(buffer.byteLength);
		for (let offset = 0; offset < buffer.byteLength; offset += this.blockSize) {
			// XOR a Nonce and Counter
			const ivOffset = offset % ivView.byteLength;
			const uniqueSequence = xor(
				ivView.slice(ivOffset, ivOffset + this.blockSize),
				counterBuffer,
			);

			// Encrypt unique sequence
			const encryptedSequence = await this.encryptBuffer(uniqueSequence.buffer);

			// XOR unique sequence and block data,
			// a data is a plain text for encryption and cipher text for decryption
			const dataSlice = buffer.slice(offset, offset + this.blockSize);
			const dataBlock = xor(
				new Uint8Array(encryptedSequence),
				new Uint8Array(dataSlice),
			);

			// Write block to a out buffer
			out.set(dataBlock, offset);

			// Increment counter
			const nextCounter = counterView.getUint32(0) + 1;
			counterView.setUint32(0, nextCounter);
		}

		return out.buffer;
	}

	public async decrypt(buffer: ArrayBuffer, iv: ArrayBuffer) {
		// CTR mode do the same operation for decryption as for encryption,
		// but instead of plain text it handles cipher text
		return this.encrypt(buffer, iv);
	}
}
