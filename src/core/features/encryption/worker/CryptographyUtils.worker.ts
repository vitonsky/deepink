import { Endpoint, expose, transfer } from 'comlink';
import sodium from 'libsodium-wrappers-sumo';

import { CryptographyUtilsWorker } from '.';

expose(
	{
		async deriveBits(input, salt, length) {
			await sodium.ready;

			if (salt.byteLength !== sodium.crypto_pwhash_argon2id_SALTBYTES)
				throw new Error(
					`Expected salt size is ${sodium.crypto_pwhash_argon2id_SALTBYTES} bytes`,
				);

			// 512mb
			const memory = 1024 ** 2 * 512;
			const ops = 2;

			const key = sodium.crypto_pwhash(
				length,
				input,
				salt,
				ops,
				memory,
				sodium.crypto_pwhash_ALG_ARGON2ID13,
			);
			sodium.memzero(input);

			return transfer(key, [key.buffer]) as Uint8Array<ArrayBuffer>;
		},
	} satisfies CryptographyUtilsWorker,
	self as Endpoint,
);
