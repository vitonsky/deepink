import { IEncryptionProcessor } from '..';

/**
 * Compose and execute a pipeline with provided processors
 */
export class PipelineProcessor implements IEncryptionProcessor {
	private readonly ciphers;
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
