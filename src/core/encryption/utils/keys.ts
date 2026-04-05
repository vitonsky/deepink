import { joinBuffers } from './buffers';

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
 * We must never use an user password anywhere, because of low entropy.
 * Instead, we derive bits via PBKDF2 to increase the entropy.
 */
export const deriveBitsFromPassword = async (
	password: string,
	context: string,
	salt?: Uint8Array<ArrayBuffer>,
) => {
	const keyMaterial = await importPasswordKey(password);

	const domain = new TextEncoder().encode(context);

	return await crypto.subtle
		.deriveBits(
			{
				name: 'PBKDF2',
				hash: 'SHA-256',
				salt: salt ? joinBuffers([domain, salt]) : domain,
				iterations: 600_000,
			},
			keyMaterial,
			256,
		)
		.then((buffer) => new Uint8Array(buffer));
};
