import { ICipher } from '../..';

/**
 * Compose a new cipher from a multiple ciphers
 */
export class CascadeCipher implements ICipher {
	private ciphers;
	constructor(ciphers: ICipher[]) {
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
