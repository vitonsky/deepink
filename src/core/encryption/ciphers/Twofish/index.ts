import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { encrypt, makeSession } from 'twofish-ts';

import { CTRCipherMode } from '../../cipherModes/CTRCipherMode';
import { BufferView, fillBuffer, joinBuffers } from '../../utils/buffers';

import { HeaderView, IEncryptionProcessor } from '../..';
import { TwofishModule } from './wasm/twofish';

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
export function transformBuffer(
	buffer: Uint8Array,
	transformBlock: (offset: number, input: Uint8Array, output: Uint8Array) => void,
	blockSize = 16,
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

	private readonly header;
	constructor(
		private readonly key: Uint8Array,
		private readonly randomBytesGenerator: (
			byteLength: number,
		) => Uint8Array<ArrayBuffer>,
	) {
		this.header = new TwofishBufferHeader(this.ivSize);
	}

	private cipher: Promise<CTRCipherMode> | null = null;
	private getCipher() {
		if (!this.cipher) {
			const session = makeSession(this.key);
			this.cipher = Promise.resolve(
				new CTRCipherMode((buffer: Uint8Array) => {
					encrypt(buffer, 0, buffer, 0, session);
					return buffer;
				}),
			);
		}

		return this.cipher;
	}

	public async load() {
		await this.getCipher();
	}

	public async encrypt(buffer: ArrayBuffer) {
		const [bufferView, padding] = fillBuffer(new Uint8Array(buffer));

		const iv = this.randomBytesGenerator(this.ivSize);

		console.time('Buffer processing');
		const cipher = await this.getCipher();
		const encryptedBuffer = await cipher.encrypt(bufferView, iv);
		console.timeEnd('Buffer processing');

		const header = this.header.createBuffer({ padding, iv: iv.buffer });
		return joinBuffers([header, encryptedBuffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		const { padding, iv } = this.header.readBuffer(buffer);

		const encryptedBuffer = new Uint8Array(buffer.slice(this.header.bufferSize));

		const cipher = await this.getCipher();
		const decryptedBufferWithPaddings = await cipher.decrypt(
			encryptedBuffer,
			new Uint8Array(iv),
		);

		const endOfDataOffset = decryptedBufferWithPaddings.byteLength - padding;
		return decryptedBufferWithPaddings.subarray(0, endOfDataOffset).buffer;
	}
}

// TODO: implement GCM mode https://en.wikipedia.org/wiki/Galois/Counter_Mode
/**
 * Twofish cipher implementation
 */
export class WasmTwofishCTRCipher implements IEncryptionProcessor {
	private readonly ivSize = 96;

	private readonly header;
	constructor(
		private readonly key: Uint8Array,
		private readonly randomBytesGenerator: (
			byteLength: number,
		) => Uint8Array<ArrayBuffer>,
	) {
		this.header = new TwofishBufferHeader(this.ivSize);
	}

	private cipher: Promise<CTRCipherMode> | null = null;
	private getCipher() {
		if (!this.cipher) {
			this.cipher = TwofishModule.load(
				readFileSync(resolve(__dirname, './wasm/twofish.wasm')),
			).then((tf) => {
				const session = tf.createSession(this.key);

				return new CTRCipherMode((buffer: Uint8Array) =>
					tf.encrypt(session, buffer),
				);
			});
		}

		return this.cipher;
	}

	public async load() {
		await this.getCipher();
	}

	public async encrypt(buffer: ArrayBuffer) {
		const [bufferView, padding] = fillBuffer(new Uint8Array(buffer));

		const iv = this.randomBytesGenerator(this.ivSize);

		console.time('Buffer processing');
		const cipher = await this.getCipher();
		const encryptedBuffer = await cipher.encrypt(bufferView, iv);
		console.timeEnd('Buffer processing');

		const header = this.header.createBuffer({ padding, iv: iv.buffer });
		return joinBuffers([header, encryptedBuffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		const { padding, iv } = this.header.readBuffer(buffer);

		const encryptedBuffer = new Uint8Array(buffer.slice(this.header.bufferSize));

		const cipher = await this.getCipher();
		const decryptedBufferWithPaddings = await cipher.decrypt(
			encryptedBuffer,
			new Uint8Array(iv),
		);

		const endOfDataOffset = decryptedBufferWithPaddings.byteLength - padding;
		return decryptedBufferWithPaddings.subarray(0, endOfDataOffset).buffer;
	}
}
