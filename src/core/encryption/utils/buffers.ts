/**
 * Join buffers into a new buffer
 */
export const joinBuffers = (buffers: ArrayBuffer[]) => {
	const bufferLen = buffers.reduce((len, buffer) => len + buffer.byteLength, 0);
	const resultBuffer = new Uint8Array(bufferLen);

	let offset = 0;
	for (const buffer of buffers) {
		resultBuffer.set(new Uint8Array(buffer), offset);
		offset += buffer.byteLength;
	}

	return resultBuffer.buffer;
};

/**
 * Fill buffer with paddings to ensure buffer size multiple 16
 * Before use original data you have to remove padding
 */
export function fillBuffer(buffer: Uint8Array, blockSize = 16): [Uint8Array, number] {
	const padding = Math.ceil(buffer.length / blockSize) * blockSize - buffer.length;
	if (padding === 0) return [buffer, 0];

	// Create new buffer with padding
	const out = new Uint8Array(buffer.length + padding);
	out.set(buffer);

	return [out, padding];
}

/**
 * Buffer view to manipulate buffer slices
 */
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
