import { CryptographyUtils } from '@core/features/encryption/worker/CryptographyUtils';

/**
 * Encodes a string password into a CryptoKey suitable for PBKDF2 derivation.
 * The raw password bytes are imported as key material — not used directly.
 */
export async function importPasswordKey(password: string): Promise<CryptoKey> {
	const passwordBytes = new TextEncoder().encode(password);

	return crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, [
		'deriveBits',
		'deriveKey',
	]);
}

/**
 * We must never use an user password anywhere, because of potentially low entropy.
 * We use Argon2id algorithm to derive bits and make a password brute force difficult
 */
export const deriveBitsFromPassword = async (
	password: string,
	salt: Uint8Array<ArrayBuffer>,
) => {
	console.time('Key derivation');

	const utils = new CryptographyUtils();
	const result = await utils
		// Explicitly copy salt buffer to allow re-use buffer
		.deriveBits(new TextEncoder().encode(password), salt.slice(), 256)
		.finally(async () => {
			await utils.dispose();
		});

	console.timeEnd('Key derivation');

	return result;
};
