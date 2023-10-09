import { joinBuffers } from './buffers';

export function base64ToBytes(base64: string) {
	const binString = atob(base64);
	return Uint8Array.from(binString as any, (m) => (m as any).codePointAt(0)).buffer;
}

export function bytesToBase64(bytes: ArrayBuffer) {
	const binString = Array.from(new Uint8Array(bytes), (x) =>
		String.fromCodePoint(x as any),
	).join('');
	return btoa(binString);
}

/**
 * Converter for buffers and Base64 string with additional comma symbols
 *
 * Useful for a really big buffers, to avoid `RangeError: invalid array length`
 */
export const extendedBase64 = {
	/**
	 * Convert a buffer to Base64 string with additional comma symbols
	 */
	encode(bytes: ArrayBuffer, bytesChunkSize: number) {
		const typedArray = new Uint8Array(bytes);
		const binStrings: string[] = [];
		for (let offset = 0; offset < typedArray.byteLength; offset += bytesChunkSize) {
			binStrings.push(
				Array.from(typedArray.slice(offset, offset + bytesChunkSize), (x) =>
					String.fromCodePoint(x as any),
				).join(''),
			);
		}

		return binStrings.map((chars) => btoa(chars)).join(',');
	},

	/**
	 * Convert a Base64 string with additional comma symbols to buffer
	 */
	decode(string: string) {
		const binStrings = string.split(',').map((enc) => atob(enc));

		const buffers = binStrings.map(
			(binString) =>
				Uint8Array.from(
					binString as any as string[],
					(m) => m.codePointAt(0) as number,
				).buffer,
		);
		return joinBuffers(buffers);
	},
} as const;
