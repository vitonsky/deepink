import { joinBuffers } from '../utils/buffers';
import { IEncryptionProcessor } from '..';

export class IntegrityError extends TypeError {
	public readonly name = 'IntegrityError';
}

/**
 * Processor prepend a header with source buffer checksum during encryption,
 * and check the sum with actual buffer checksum during decryption.
 */
export class BufferIntegrityProcessor implements IEncryptionProcessor {
	constructor(private readonly key: Uint8Array<ArrayBuffer>) {}

	public encrypt = async (buffer: ArrayBuffer) => {
		const key = await crypto.subtle.importKey(
			'raw',
			this.key,
			{ name: 'HMAC', hash: 'SHA-256', length: 256 },
			false,
			['sign', 'verify'],
		);

		const signature = await crypto.subtle.sign('HMAC', key, buffer);

		return joinBuffers([signature, buffer]);
	};

	/**
	 * @throws `IntegrityError` when check sum do not match
	 */
	public decrypt = async (buffer: ArrayBuffer) => {
		const key = await crypto.subtle.importKey(
			'raw',
			this.key,
			{ name: 'HMAC', hash: 'SHA-256', length: 256 },
			false,
			['sign', 'verify'],
		);
		const signature = new Uint8Array(buffer, 0, 32);
		const data = new Uint8Array(buffer, 32);

		const isValidSignature = await crypto.subtle.verify('HMAC', key, signature, data);

		if (!isValidSignature)
			throw new IntegrityError(
				'Integrity violation. HMAC signature check is failed',
			);

		return data.slice().buffer;
	};
}
