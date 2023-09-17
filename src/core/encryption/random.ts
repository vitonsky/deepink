export function getRandomBytes(length = 10) {
	const array = new Uint8Array(length);
	return self.crypto.getRandomValues(array).buffer;
}
