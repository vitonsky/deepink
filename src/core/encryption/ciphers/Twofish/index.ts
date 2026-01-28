import { encrypt, makeSession } from 'twofish-ts';

import { CTRCipherMode } from '../../cipherModes/CTRCipherMode';
import { BufferView, fillBuffer, joinBuffers } from '../../utils/buffers';

import { HeaderView, IEncryptionProcessor, RandomBytesGenerator } from '../..';

const blockSize = 16;

export type TwofishBufferHeaderStruct = {
	padding: number;
	iv: ArrayBuffer;
};

export class TwofishBufferHeader implements HeaderView<TwofishBufferHeaderStruct> {
	public readonly bufferSize = 128;
	private readonly offsets = {
		padding: 0,
		iv: 1,
	};

	private readonly ivSize;
	constructor(ivSize: number) {
		this.ivSize = ivSize;
	}

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
			iv: rawView.getBytes(this.offsets.iv, this.offsets.iv + this.ivSize),
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

// TODO: implement GCM mode https://en.wikipedia.org/wiki/Galois/Counter_Mode
/**
 * Twofish cipher implementation
 */
export class TwofishCTRCipher implements IEncryptionProcessor {
	private readonly ivSize = 96;

	private readonly key;
	private readonly randomBytesGenerator: RandomBytesGenerator;
	private readonly header;
	private readonly ctrCipher;
	constructor(cipher: Uint8Array, randomBytesGenerator: RandomBytesGenerator) {
		this.randomBytesGenerator = randomBytesGenerator;

		this.key = makeSession(cipher);
		this.header = new TwofishBufferHeader(this.ivSize);
		this.ctrCipher = new CTRCipherMode(this.encryptBuffer);
	}

	private readonly encryptBuffer = async (buffer: ArrayBuffer) => {
		return transformBuffer(new Uint8Array(buffer), (offset, input, output) => {
			encrypt(input, offset, output, offset, this.key);
		}).buffer;
	};

	public async encrypt(buffer: ArrayBuffer) {
		const [bufferView, padding] = fillBuffer(new Uint8Array(buffer));

		const iv = this.randomBytesGenerator(this.ivSize);
		const encryptedBuffer = await this.ctrCipher.encrypt(
			bufferView.buffer as ArrayBuffer,
			iv,
		);

		const header = this.header.createBuffer({ padding, iv });
		return joinBuffers([header, encryptedBuffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		const { padding, iv } = this.header.readBuffer(buffer);

		const encryptedBuffer = new Uint8Array(buffer.slice(this.header.bufferSize));
		const decryptedBufferWithPaddings = await this.ctrCipher.decrypt(
			encryptedBuffer.buffer,
			iv,
		);

		const endOfDataOffset = decryptedBufferWithPaddings.byteLength - padding;
		return decryptedBufferWithPaddings.slice(0, endOfDataOffset);
	}
}
