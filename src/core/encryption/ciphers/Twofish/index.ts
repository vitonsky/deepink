import { encrypt, makeSession } from 'twofish-ts';

import { CTRCipherMode } from '../../cipherModes/CTRCipherMode';
import { BufferView, fillBuffer, joinBuffers } from '../../utils/buffers';
import { getRandomBytes } from '../../utils/random';

import { HeaderView, ICipher } from '../..';

const blockSize = 16;

export type TwofishBufferHeaderStruct = {
	padding: number;
	iv: ArrayBuffer;
};

export class TwofishBufferHeader implements HeaderView<TwofishBufferHeaderStruct> {
	public readonly bufferSize = 32;
	private readonly offsets = {
		padding: 0,
		iv: 1,
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
	private readonly ctrCipher;
	constructor(cipher: string) {
		this.key = makeSession(new TextEncoder().encode(cipher));
		this.header = new TwofishBufferHeader();
		this.ctrCipher = new CTRCipherMode(this.encryptBuffer);
	}

	private encryptBuffer = async (buffer: ArrayBuffer) => {
		return transformBuffer(new Uint8Array(buffer), (offset, input, output) => {
			encrypt(input, offset, output, offset, this.key);
		}).buffer;
	};

	public async encrypt(buffer: ArrayBuffer) {
		const [bufferView, padding] = fillBuffer(new Uint8Array(buffer));

		const iv = getRandomBytes(blockSize);
		const encryptedBuffer = await this.ctrCipher.encrypt(bufferView, iv);

		const header = this.header.createBuffer({ padding, iv });
		return joinBuffers([header, encryptedBuffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		const { padding, iv } = this.header.readBuffer(buffer);

		const encryptedBuffer = new Uint8Array(buffer.slice(this.header.bufferSize));
		const decryptedBufferWithPaddings = await this.ctrCipher.decrypt(
			encryptedBuffer,
			iv,
		);

		const endOfDataOffset = decryptedBufferWithPaddings.byteLength - padding;
		return decryptedBufferWithPaddings.slice(0, endOfDataOffset);
	}
}
