/**
 * Fill buffer with cryptographically strong random values and return the same buffer
 */
export function fillBufferWithRandomBytes<T extends ArrayBufferView>(buffer: T): T {
	const bytesLimit = 65535;

	// Fill if quote is not exceeded
	if (buffer.byteLength <= bytesLimit) {
		self.crypto.getRandomValues(buffer);
		return buffer;
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

	return buffer;
}

/**
 * Creates and returns buffer with cryptographically strong random values
 *
 * @param bytesLength buffer size in bytes
 */
export function getRandomBytes(bytesLength = 16): ArrayBuffer {
	const typedArray = new Uint8Array(bytesLength);
	return fillBufferWithRandomBytes(typedArray).buffer;
}
