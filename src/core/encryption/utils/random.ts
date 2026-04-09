/**
 * Fill buffer with cryptographically strong random values and return the same buffer
 */
export function fillBufferWithRandomBytes(buffer: Uint8Array): Uint8Array {
	const bytesLimit = 65535;

	// Fill if quote is not exceeded
	if (buffer.byteLength <= bytesLimit) {
		globalThis.crypto.getRandomValues(buffer);
		return buffer;
	}

	// Fill buffer by blocks
	for (let offset = 0; offset < buffer.byteLength; offset += bytesLimit) {
		// Generate block
		const bytesToFill = buffer.byteLength - offset;
		const bytesToAdd = Math.min(bytesLimit, bytesToFill);
		const blockBuffer = new Uint8Array(bytesToAdd);
		globalThis.crypto.getRandomValues(blockBuffer);

		// Fill with offset
		buffer.set(blockBuffer, offset);
	}

	return buffer;
}

/**
 * Creates and returns buffer with cryptographically strong random values
 *
 * @param bytesLength buffer size in bytes
 */
export function getRandomBytes(bytesLength = 16) {
	return fillBufferWithRandomBytes(
		new Uint8Array(bytesLength),
	) as Uint8Array<ArrayBuffer>;
}
