// eslint-disable-next-line import/no-unresolved

import { joinBuffers } from '../utils/buffers';
import { HeaderView, IEncryptionProcessor } from '..';

export type SizeObfuscationHeaderStruct = {
	padding: number;
};

export class SizeObfuscationHeader implements HeaderView<SizeObfuscationHeaderStruct> {
	public readonly bufferSize = 8;

	public createBuffer(data: SizeObfuscationHeaderStruct): ArrayBuffer {
		const buffer = new ArrayBuffer(this.bufferSize);
		const view = new DataView(buffer, 0);

		view.setInt32(0, data.padding);

		return buffer;
	}

	public readBuffer(buffer: ArrayBuffer): SizeObfuscationHeaderStruct {
		if (buffer.byteLength < this.bufferSize)
			throw new TypeError('Header buffer have too small size');

		const view = new DataView(buffer, 0, this.bufferSize);

		return {
			padding: view.getInt32(0),
		};
	}
}

export function fillBufferWithRandomBytes(buffer: ArrayBufferView) {
	const bytesLimit = 65535;

	// Fill if quote is not exceeded
	if (buffer.byteLength <= bytesLimit) {
		self.crypto.getRandomValues(buffer);
		return;
	}

	// Fill buffer by blocks
	const bufferView = new Uint8Array(buffer.buffer);
	for (let offset = 0; offset < buffer.byteLength; offset += bytesLimit) {
		// Generate block
		const bytesToFill = buffer.byteLength - offset;
		const bytesToAdd = Math.min(bytesLimit, bytesToFill);
		const blockBuffer = new Uint8Array(bytesToAdd);
		self.crypto.getRandomValues(blockBuffer);

		// Fill with offset
		bufferView.set(blockBuffer, offset);
	}
}

const KB = 1024;
const MB = KB * 1024;

/**
 * Obfuscates a buffer size with adding to a buffer random number of bytes
 */
export class BufferSizeObfuscationProcessor implements IEncryptionProcessor {
	private readonly header;
	private readonly paddingSizeLimit;
	constructor(paddingSizeLimit?: number) {
		this.header = new SizeObfuscationHeader();
		this.paddingSizeLimit = paddingSizeLimit ? Math.max(0, paddingSizeLimit) : null;
	}

	private getPaddingSizeLimit(dataSize: number) {
		if (dataSize <= MB * 3) return MB * 1;
		if (dataSize <= MB * 5) return MB * 3;
		if (dataSize <= MB * 8) return MB * 5;
		if (dataSize <= MB * 10) return MB * 8;
		if (dataSize <= MB * 50) return MB * 10;
		if (dataSize <= MB * 200) return MB * 50;
		if (dataSize <= MB * 500) return MB * 90;

		// For other cases
		return MB * 300;
	}

	public encrypt = async (buffer: ArrayBuffer) => {
		// Generate random padding size
		const randomBytes = new Uint32Array(1);
		fillBufferWithRandomBytes(randomBytes);

		// Clamp number to a limit
		const paddingSizeLimitForBuffer = this.getPaddingSizeLimit(buffer.byteLength);
		const paddingSizeLimit = this.paddingSizeLimit
			? Math.min(this.paddingSizeLimit, paddingSizeLimitForBuffer)
			: paddingSizeLimitForBuffer;
		const padding = randomBytes[0] % (paddingSizeLimit + 1);

		// Generate padding
		const paddingBuffer = new Uint8Array(padding);
		fillBufferWithRandomBytes(paddingBuffer);

		const header = this.header.createBuffer({
			padding,
		});

		return joinBuffers([header, paddingBuffer, buffer]);
	};

	public decrypt = async (buffer: ArrayBuffer) => {
		const header = this.header.readBuffer(buffer);

		const dataOffset = this.header.bufferSize + header.padding;
		return buffer.slice(dataOffset);
	};
}
