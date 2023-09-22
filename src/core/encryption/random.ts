export function getRandomBytes(length = 16) {
	const array = new Uint8Array(length);
	return self.crypto.getRandomValues(array).buffer;
}
