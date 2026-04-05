export function fromHex(str: string) {
	return new Uint8Array(Buffer.from(str, 'hex'));
}
export function toHex(buf: Uint8Array) {
	return Buffer.from(buf).toString('hex').toUpperCase();
}
