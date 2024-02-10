import { joinBuffers } from '../utils/buffers';
import { HeaderView, IEncryptionProcessor, RandomBytesGenerator } from '..';

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

const KB = 1024;
const MB = KB * 1024;

/**
 * Obfuscates a buffer size with adding to a buffer random number of bytes
 */
export class BufferSizeObfuscationProcessor implements IEncryptionProcessor {
	private readonly header;
	private readonly randomBytesGenerator: RandomBytesGenerator;
	private readonly paddingSizeLimit;
	constructor(randomBytesGenerator: RandomBytesGenerator, paddingSizeLimit?: number) {
		this.header = new SizeObfuscationHeader();
		this.randomBytesGenerator = randomBytesGenerator;
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
		// Here we create a buffer with random 4 byte which is 32 bits,
		// then creates a typed array from a buffer and takes a first number
		const [randomNumber] = new Uint32Array(this.randomBytesGenerator(4));

		// Clamp padding size to a limit
		const paddingSizeLimitForBuffer = this.getPaddingSizeLimit(buffer.byteLength);
		const paddingSizeLimit = this.paddingSizeLimit
			? Math.min(this.paddingSizeLimit, paddingSizeLimitForBuffer)
			: paddingSizeLimitForBuffer;
		const padding = randomNumber % (paddingSizeLimit + 1);

		const header = this.header.createBuffer({
			padding,
		});

		const paddingBuffer = this.randomBytesGenerator(padding);

		return joinBuffers([header, paddingBuffer, buffer]);
	};

	public decrypt = async (buffer: ArrayBuffer) => {
		const header = this.header.readBuffer(buffer);

		const dataOffset = this.header.bufferSize + header.padding;
		return buffer.slice(dataOffset);
	};
}
