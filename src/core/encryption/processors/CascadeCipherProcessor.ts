import { IEncryptionProcessor } from "..";

/**
 * Compose a new cipher from a multiple ciphers
 */
export class CascadeCipherProcessor implements IEncryptionProcessor {
	private ciphers;
	constructor(ciphers: IEncryptionProcessor[]) {
		this.ciphers = ciphers;
	}

	public async encrypt(buffer: ArrayBuffer) {
		return this.ciphers.reduce(
			(bufferPromise, cipher) =>
				bufferPromise.then((buffer) => cipher.encrypt(buffer)),
			Promise.resolve(buffer),
		);
	}

	public async decrypt(buffer: ArrayBuffer) {
		return [...this.ciphers]
			.reverse()
			.reduce(
				(bufferPromise, cipher) =>
					bufferPromise.then((buffer) => cipher.decrypt(buffer)),
				Promise.resolve(buffer),
			);
	}
}
