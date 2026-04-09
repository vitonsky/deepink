import { CryptographyUtils } from '@core/features/encryption/worker/CryptographyUtils';

/**
 * We must never use an user password anywhere, because of potentially low entropy.
 * We use Argon2id algorithm to derive bits and make a password brute force difficult
 */
export const deriveBitsFromPassword = async (
	password: string,
	salt: Uint8Array<ArrayBuffer>,
) => {
	const utils = new CryptographyUtils();
	return utils
		.deriveBits(new TextEncoder().encode(password), salt, 256)
		.finally(async () => {
			await utils.dispose();
		});
};
