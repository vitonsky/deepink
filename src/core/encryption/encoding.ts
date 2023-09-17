export function base64ToBytes(base64: string) {
	const binString = atob(base64);
	return Uint8Array.from(binString as any, (m) => (m as any).codePointAt(0));
}

export function bytesToBase64(bytes: ArrayBuffer) {
	const binString = Array.from(new Uint8Array(bytes), (x) =>
		String.fromCodePoint(x as any),
	).join('');
	return btoa(binString);
}
