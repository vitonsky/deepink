import { decrypt, encrypt, makeSession } from 'twofish-ts';

import { ICipher } from '../..';

const blockSize = 16;

/**
 * Fill buffer with paddings to ensure buffer size multiple 16
 * Before use original data you have to remove padding
 */
function fillBuffer(buffer: Uint8Array): [Uint8Array, number] {
	const padding = Math.ceil(buffer.length / blockSize) * blockSize - buffer.length;
	if (padding === 0) return [buffer, 0];

	// Create new buffer with padding
	const out = new Uint8Array(buffer.length + padding);
	out.set(buffer);

	return [out, padding];
}

/**
 * Inner util to transform block with cipher
 * Util creates a new buffer instead of mutate original buffer.
 */
function transformBuffer(
	buffer: Uint8Array,
	transformBlock: (offset: number, input: Uint8Array, output: Uint8Array) => void,
) {
	const out = new Uint8Array(buffer.length);
	for (let offset = 0; offset < buffer.length; offset += blockSize) {
		transformBlock(offset, buffer, out);
	}

	return out;
}

/**
 * Twofish cipher implementation
 */
export class Twofish implements ICipher {
	private readonly headerSize = 32;
	private readonly headerPaddingOffset = 0;
	private readonly key;
	constructor(cipher: string) {
		this.key = makeSession(new TextEncoder().encode(cipher));
	}

	public async encrypt(buffer: ArrayBuffer) {
		const [bufferView, padding] = fillBuffer(new Uint8Array(buffer));

		const encryptedBuffer = transformBuffer(bufferView, (offset, input, output) => {
			encrypt(input, offset, output, offset, this.key);
		});

		// Compose out buffer with meta data to decode
		const outBuffer = new Uint8Array(this.headerSize + encryptedBuffer.length);
		outBuffer.set(encryptedBuffer, this.headerSize);

		const headerView = new DataView(outBuffer.buffer, 0, this.headerSize);
		headerView.setUint8(this.headerPaddingOffset, padding);

		return outBuffer.buffer;
	}

	public async decrypt(buffer: ArrayBuffer) {
		const headerView = new DataView(buffer, 0, this.headerSize);
		const padding = headerView.getUint8(this.headerPaddingOffset);

		const encryptedBuffer = new Uint8Array(buffer.slice(this.headerSize));
		const decryptedBufferWithPaddings = transformBuffer(
			encryptedBuffer,
			(offset, input, output) => {
				decrypt(input, offset, output, offset, this.key);
			},
		);

		const endOfDataOffset = decryptedBufferWithPaddings.length - padding;
		const result = decryptedBufferWithPaddings.slice(0, endOfDataOffset);
		return result.buffer;
	}
}
