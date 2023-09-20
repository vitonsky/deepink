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

// TODO: improve meta data structure
export class Twofish implements ICipher {
	private readonly metaDataSize = 300;
	private readonly key;
	constructor(cipher: string) {
		this.key = makeSession(new TextEncoder().encode(cipher));
	}

	public async encrypt(buffer: ArrayBuffer) {
		const [bufferView, padding] = fillBuffer(new Uint8Array(buffer));

		const encryptedBuffer = transformBuffer(bufferView, (offset, input, output) => {
			encrypt(input, offset, output, offset, this.key);
		});

		// Compose result buffer with meta data to decode
		const outBuffer = new Uint8Array(this.metaDataSize + encryptedBuffer.length);
		outBuffer.set(encryptedBuffer, this.metaDataSize);

		const meta = new TextEncoder().encode(padding.toString());
		outBuffer.set(meta, 0);

		return outBuffer.buffer;
	}

	public async decrypt(buffer: ArrayBuffer) {
		const meta = new TextDecoder().decode(buffer.slice(0, this.metaDataSize));
		const padding = parseInt(meta);

		const encryptedBuffer = new Uint8Array(buffer.slice(this.metaDataSize));
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
