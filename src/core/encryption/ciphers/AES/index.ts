import { joinArrayBuffers } from '../../buffers';
import { getRandomBits } from '../../random';

import { ICipher } from '../..';

export async function getDerivedKey(passKey: string, salt: Uint8Array) {
	const codec = new TextEncoder();
	const keyBytes = codec.encode(passKey);

	const derivedKey = await window.crypto.subtle
		.importKey('raw', keyBytes, { name: 'PBKDF2' }, false, [
			'deriveBits',
			'deriveKey',
		])
		.then((key) => {
			return window.crypto.subtle.deriveKey(
				{
					name: 'PBKDF2',
					salt,
					iterations: 100,
					hash: 'SHA-512',
				},
				key,

				// For AES the length required to be 128 or 256 bits (not bytes)
				{ name: 'AES-CBC', length: 256 },

				// Whether or not the key is extractable (less secure) or not (more secure)
				// when false, the key can only be passed as a web crypto object, not inspected
				true,

				// this web crypto object will only be allowed for these functions
				['encrypt', 'decrypt'],
			);
		})
		.then((webKey) => crypto.subtle.exportKey('raw', webKey));

	return window.crypto.subtle.importKey(
		'raw',
		derivedKey,
		{
			//this is the algorithm options
			name: 'AES-GCM',
		},
		false,
		['encrypt', 'decrypt'],
	);
}

// https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
function encrypt(data: ArrayBuffer, key: CryptoKey, iv: any) {
	return window.crypto.subtle.encrypt(
		{
			name: 'AES-GCM',

			// Don't re-use initialization vectors!
			// Always generate a new iv every time your encrypt!
			// Recommended to use 96 bytes length
			iv,

			// Tag length (optional)
			// can be 32, 64, 96, 104, 112, 120 or 128 (default)
			tagLength: 128,
		},
		key,
		data,
	);
}

function decrypt(data: ArrayBuffer, key: CryptoKey, iv: any) {
	return window.crypto.subtle.decrypt(
		{
			name: 'AES-GCM',
			//The initialization vector been used to encrypt
			iv,

			//The tagLength you used to encrypt (if any)
			tagLength: 128,
		},
		key,
		data,
	);
}

/**
 * AES-GCM cipher
 * Recommendations: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
 */
export class AESCipher implements ICipher {
	private readonly ivLen = 96;

	private key: Promise<CryptoKey>;
	constructor(cipher: string, salt: Uint8Array) {
		this.key = getDerivedKey(cipher, salt);
	}

	public async encrypt(data: ArrayBuffer) {
		const key = await this.key;

		const iv = getRandomBits(this.ivLen);
		const encryptedDataBuffer = await encrypt(data, key, iv);

		return joinArrayBuffers([iv, encryptedDataBuffer]);
	}

	public async decrypt(data: ArrayBuffer) {
		const key = await this.key;

		const iv = data.slice(0, this.ivLen);
		const encryptedDataBuffer = data.slice(this.ivLen);

		return decrypt(encryptedDataBuffer, key, iv);
	}
}
