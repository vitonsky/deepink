import { joinBuffers } from './buffers';

/**
 * Creates and return derived `CryptoKey` from a master password
 */
export async function getMasterKey(
	masterPassword: string | ArrayBuffer,
	salt: ArrayBuffer,
) {
	const codec = new TextEncoder();

	const key =
		typeof masterPassword === 'string'
			? codec.encode(masterPassword)
			: masterPassword;

	return await self.crypto.subtle
		.importKey('raw', key, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey'])
		// We don't want to use key from original password, only derived keys,
		// so here we derive a new key based on password
		.then((key) =>
			self.crypto.subtle.deriveKey(
				{
					name: 'PBKDF2',
					salt: new Uint8Array(salt),
					iterations: 100000,
					hash: 'SHA-512',
				},
				key,
				{
					name: 'AES-GCM',
					length: 256,
				},

				// Whether or not the key is extractable
				true,

				// This usage limitations will be ignored, because we import and then export key with new permissions
				['encrypt', 'decrypt'],
			),
		)
		// Export and import of key is necessary, to bypass limitation about key can't be derived of derived key
		// Otherwise generates error `DOMException: key.algorithm does not match that of operation`
		.then((key) => self.crypto.subtle.exportKey('raw', key))
		.then((key) =>
			self.crypto.subtle.importKey('raw', key, { name: 'PBKDF2' }, false, [
				'deriveBits',
				'deriveKey',
			]),
		);
}

type KeyAlgorithm =
	| AlgorithmIdentifier
	| AesDerivedKeyParams
	| HmacImportParams
	| HkdfParams
	| Pbkdf2Params;

/**
 * Creates object to generate derived keys and bytes based on provided master key
 */
export async function getDerivedKeysManager(masterKey: CryptoKey, salt: Uint8Array) {
	const codec = new TextEncoder();

	const getScopedSalt = (scope: string) =>
		joinBuffers([codec.encode(scope).buffer, salt.buffer]);

	return {
		async getDerivedKey(context: string, algorithm: KeyAlgorithm) {
			return self.crypto.subtle.deriveKey(
				{
					name: 'PBKDF2',
					salt: getScopedSalt(context),
					iterations: 100000,
					hash: 'SHA-512',
				},
				masterKey,
				algorithm,

				// Whether or not the key is extractable (less secure) or not (more secure)
				// when false, the key can only be passed as a web crypto object, not inspected
				true,

				// this web crypto object will only be allowed for these functions
				['encrypt', 'decrypt'],
			);
		},

		async getDerivedBytes(context: string, length: number) {
			if (length % 8 !== 0) throw new TypeError('Length is not multiple to 8');

			return self.crypto.subtle.deriveBits(
				{
					name: 'PBKDF2',
					salt: getScopedSalt(context),
					iterations: 100000,
					hash: 'SHA-256',
				},
				masterKey,
				length,
			);
		},
	};
}
