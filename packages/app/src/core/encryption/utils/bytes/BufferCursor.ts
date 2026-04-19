export class BufferCursor {
	private offset = 0;
	constructor(private readonly buffer: ArrayBuffer) {}

	getRemainingBytes() {
		return this.buffer.byteLength - this.offset;
	}

	readBytes(length: number): Uint8Array | null {
		const remaining = this.getRemainingBytes();

		if (remaining <= 0) return null;

		length = Math.min(length, remaining);

		const slice = new Uint8Array(this.buffer, this.offset, length);
		this.offset += length;
		return slice;
	}

	writeBytes(data: Uint8Array): void {
		const remaining = this.getRemainingBytes();
		if (data.length > remaining)
			throw new RangeError(
				`Cannot insert ${data.length} bytes. Remaining bytes in buffer: ${remaining}`,
			);

		new Uint8Array(this.buffer, this.offset, data.length).set(data);
		this.offset += data.length;
	}
}
