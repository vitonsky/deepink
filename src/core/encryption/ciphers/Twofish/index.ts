import { decrypt, encrypt, makeSession } from 'twofish-ts';

import { joinArrayBuffers } from '../../buffers';

import { HeaderView, ICipher } from '../..';

export type TwofishBufferHeaderStruct = {
	padding: number;
};

export class TwofishBufferHeader implements HeaderView<TwofishBufferHeaderStruct> {
	public readonly bufferSize = 32;
	private readonly headerPaddingOffset = 0;

	public createBuffer(data: TwofishBufferHeaderStruct): ArrayBuffer {
		const buffer = new ArrayBuffer(this.bufferSize);
		const view = new DataView(buffer, 0);

		view.setUint8(this.headerPaddingOffset, data.padding);

		return buffer;
	}

	public readBuffer(buffer: ArrayBuffer): TwofishBufferHeaderStruct {
		if (buffer.byteLength < this.bufferSize)
			throw new TypeError('Header buffer have too small size');

		const view = new DataView(buffer, 0, this.bufferSize);

		return {
			padding: view.getUint8(this.headerPaddingOffset),
		};
	}
}

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
	private readonly key;
	private readonly header;
	constructor(cipher: string) {
		this.key = makeSession(new TextEncoder().encode(cipher));
		this.header = new TwofishBufferHeader();
	}

	public async encrypt(buffer: ArrayBuffer) {
		const [bufferView, padding] = fillBuffer(new Uint8Array(buffer));

		const header = this.header.createBuffer({ padding });

		const encryptedBuffer = transformBuffer(bufferView, (offset, input, output) => {
			encrypt(input, offset, output, offset, this.key);
		});

		return joinArrayBuffers([header, encryptedBuffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		const { padding } = this.header.readBuffer(buffer);

		const encryptedBuffer = new Uint8Array(buffer.slice(this.header.bufferSize));
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
