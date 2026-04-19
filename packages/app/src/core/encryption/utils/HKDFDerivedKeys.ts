export class HKDFDerivedKeys {
	private readonly key;
	constructor(
		key: Uint8Array<ArrayBuffer>,
		private readonly iv: Uint8Array<ArrayBuffer>,
	) {
		this.key = crypto.subtle.importKey('raw', key, 'HKDF', false, [
			'deriveKey',
			'deriveBits',
		]);
	}

	public stringToBuffer(text: string) {
		return new TextEncoder().encode(text);
	}

	public async deriveBits(length: number, context: string | Uint8Array<ArrayBuffer>) {
		const key = await this.key;

		return await crypto.subtle.deriveBits(
			{
				name: 'HKDF',
				hash: 'SHA-256',
				salt: this.iv,
				info:
					typeof context === 'string' ? this.stringToBuffer(context) : context,
			},
			key,
			length,
		);
	}

	public async deriveBytes(length: number, context: string | Uint8Array<ArrayBuffer>) {
		const buffer = await this.deriveBits(length * 8, context);
		return new Uint8Array(buffer);
	}
}
