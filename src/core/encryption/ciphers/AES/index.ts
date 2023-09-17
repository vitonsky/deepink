import { joinArrayBuffers } from '../../buffers';
import { getRandomBytes } from '../../random';

import { ICipher } from '../..';

export async function importKey(passKey: string, salt: Uint8Array) {
	const codec = new TextEncoder();

	const derivedKey = await window.crypto.subtle
		.importKey('raw', codec.encode(passKey), { name: 'PBKDF2' }, false, [
			'deriveBits',
			'deriveKey',
		])
		.then(function (key) {
			return window.crypto.subtle.deriveKey(
				{
					name: 'PBKDF2',

					// don't get too ambitious, or at least remember
					salt,
					// that low-power phones will access your app
					iterations: 100,
					hash: 'SHA-256',
				},
				key,

				// Note: for this demo we don't actually need a cipher suite,
				// but the api requires that it must be specified.

				// For AES the length required to be 128 or 256 bits (not bytes)
				{ name: 'AES-CBC', length: 256 },

				// Whether or not the key is extractable (less secure) or not (more secure)
				// when false, the key can only be passed as a web crypto object, not inspected
				true,

				// this web crypto object will only be allowed for these functions
				['encrypt', 'decrypt'],
			);
		})
		.then(function (webKey) {
			return crypto.subtle.exportKey('raw', webKey);
		});

	return window.crypto.subtle.importKey(
		'raw', //can be "jwk" or "raw"
		derivedKey,
		{
			//this is the algorithm options
			name: 'AES-GCM',
		},
		false, //whether the key is extractable (i.e. can be used in exportKey)
		['encrypt', 'decrypt'], //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
	);
}

function encrypt(data: ArrayBuffer, key: CryptoKey, iv: any) {
	return window.crypto.subtle.encrypt(
		{
			name: 'AES-GCM',

			//Don't re-use initialization vectors!
			//Always generate a new iv every time your encrypt!
			//Recommended to use 12 bytes length
			iv: iv,

			//Additional authentication data (optional)
			// additionalData: ArrayBuffer,

			//Tag length (optional)
			tagLength: 128, //can be 32, 64, 96, 104, 112, 120 or 128 (default)
		},
		key, //from generateKey or importKey above
		data, //ArrayBuffer of data you want to encrypt
	);
}

function decrypt(data: ArrayBuffer, key: CryptoKey, iv: any) {
	return window.crypto.subtle
		.decrypt(
			{
				name: 'AES-GCM',
				iv: iv, //The initialization vector you used to encrypt
				//additionalData: ArrayBuffer, //The addtionalData you used to encrypt (if any)
				tagLength: 128, //The tagLength you used to encrypt (if any)
			},
			key, //from generateKey or importKey above
			data, //ArrayBuffer of the data
		)
		.catch((err) => {
			console.warn('dbg1', err);
			throw err;
		});
}

export class AESCipher implements ICipher {
	private readonly ivLen = 20;

	private key: Promise<CryptoKey>;
	constructor(cipher: string, salt: Uint8Array) {
		this.key = importKey(cipher, salt);
	}

	public async encrypt(data: ArrayBuffer) {
		const key = await this.key;

		const iv = getRandomBytes(this.ivLen);
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
