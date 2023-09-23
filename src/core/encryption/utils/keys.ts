import { joinBuffers } from './buffers';

/**
 * Creates `CryptoKey` from master password
 */
export async function getMasterKey(masterPassword: string) {
	const codec = new TextEncoder();

	return await self.crypto.subtle.importKey(
		'raw',
		codec.encode(masterPassword),
		{ name: 'PBKDF2' },
		false,
		['deriveBits', 'deriveKey'],
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
		joinBuffers([salt.buffer, codec.encode(scope).buffer]);

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
