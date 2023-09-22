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
