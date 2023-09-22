import { encrypt, makeSession } from 'twofish-ts';

import { joinArrayBuffers } from '../../buffers';
import { CTRCipherMode } from '../../cipherModes/CTRCipherMode';
import { getRandomBits } from '../../random';

import { HeaderView, ICipher } from '../..';

const blockSize = 16;

export type TwofishBufferHeaderStruct = {
	padding: number;
	iv: ArrayBuffer;
};

export class BufferView {
	private readonly buffer;
	constructor(buffer: ArrayBuffer) {
		this.buffer = buffer;
	}

	public getBytes(offset: number = 0, end?: number) {
		return this.buffer.slice(offset, end);
	}

	public setBytes(buffer: ArrayBuffer, offset: number = 0) {
		if (offset > this.buffer.byteLength)
			throw new RangeError('Offset out of buffer size');
		if (offset + buffer.byteLength > this.buffer.byteLength)
			throw new RangeError(
				'Buffer size with current offset will out of buffer size',
			);

		const srcBufferView = new Uint8Array(buffer);
		const targetBufferView = new Uint8Array(this.buffer);
		for (let srcOffset = 0; srcOffset < buffer.byteLength; srcOffset++) {
			targetBufferView[offset + srcOffset] = srcBufferView[srcOffset];
		}
	}
}

export class TwofishBufferHeader implements HeaderView<TwofishBufferHeaderStruct> {
	public readonly bufferSize = 32;
	private readonly offsets = {
		padding: 0,
		iv: 12,
	};

	public createBuffer(data: TwofishBufferHeaderStruct): ArrayBuffer {
		const buffer = new ArrayBuffer(this.bufferSize);
		const view = new DataView(buffer, 0);
		const rawView = new BufferView(buffer);

		view.setUint8(this.offsets.padding, data.padding);
		rawView.setBytes(data.iv, this.offsets.iv);

		return buffer;
	}

	public readBuffer(buffer: ArrayBuffer): TwofishBufferHeaderStruct {
		if (buffer.byteLength < this.bufferSize)
			throw new TypeError('Header buffer have too small size');

		const view = new DataView(buffer, 0, this.bufferSize);
		const rawView = new BufferView(buffer);

		return {
			padding: view.getUint8(this.offsets.padding),
			iv: rawView.getBytes(this.offsets.iv, this.offsets.iv + blockSize),
		};
	}
}

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

export function xor(a: Uint8Array, b: Uint8Array) {
	if (a.byteLength !== b.byteLength)
		throw new TypeError('Buffers length are not equal');

	const result = new Uint8Array(a.byteLength);
	for (let offset = 0; offset < a.byteLength; offset += 1) {
		// eslint-disable-next-line no-bitwise
		result[offset] = a[offset] ^ b[offset];
	}

	return result;
}

/**
 * Twofish cipher implementation
 */
export class Twofish implements ICipher {
	private readonly header;
	private readonly ctr;
	private readonly key;
	constructor(cipher: string) {
		this.key = makeSession(new TextEncoder().encode(cipher));
		this.header = new TwofishBufferHeader();
		this.ctr = new CTRCipherMode(this.encryptBuffer);
	}

	private encryptBuffer = async (buffer: ArrayBuffer) => {
		return transformBuffer(new Uint8Array(buffer), (offset, input, output) => {
			encrypt(input, offset, output, offset, this.key);
		}).buffer;
	};

	public async encrypt(buffer: ArrayBuffer) {
		const [bufferView, padding] = fillBuffer(new Uint8Array(buffer));

		const iv = getRandomBits(blockSize);
		const encryptedBuffer = await this.ctr.encrypt(bufferView, iv);

		const header = this.header.createBuffer({ padding, iv });
		return joinArrayBuffers([header, encryptedBuffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		const { padding, iv } = this.header.readBuffer(buffer);

		const encryptedBuffer = new Uint8Array(buffer.slice(this.header.bufferSize));
		const decryptedBufferWithPaddings = await this.ctr.decrypt(encryptedBuffer, iv);

		const endOfDataOffset = decryptedBufferWithPaddings.byteLength - padding;
		return decryptedBufferWithPaddings.slice(0, endOfDataOffset);
	}
}
