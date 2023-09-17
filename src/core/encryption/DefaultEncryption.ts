import { EncryptionModule } from '.';

async function importKey(passKey: string) {
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
					// TODO: generate salt
					// TODO: keep salt in user profile directory
					// don't get too ambitious, or at least remember
					salt: codec.encode("=aG$<jPJQ}qqHh?iUB%]c(x'xp(ynZ"),
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

function encrypt(data: ArrayBuffer, key: any, iv: any) {
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

function decrypt(data: ArrayBuffer, key: any, iv: any) {
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

// Example from https://gist.github.com/mpgn/2f990997b9aa5fad3f90ff94546fae1e
const iv = new Uint8Array([188, 185, 57, 146, 246, 194, 114, 34, 12, 80, 198, 77]);

function base64ToBytes(base64: string) {
	const binString = atob(base64);
	return Uint8Array.from(binString as any, (m) => (m as any).codePointAt(0));
}

function bytesToBase64(bytes: ArrayBuffer) {
	const binString = Array.from(new Uint8Array(bytes), (x) =>
		String.fromCodePoint(x as any),
	).join('');
	return btoa(binString);
}

export class DefaultEncryption implements EncryptionModule {
	private readonly secretKey;
	constructor(secretKey: string) {
		this.secretKey = secretKey;
	}

	public encrypt = async <T extends string | ArrayBuffer>(rawData: T): Promise<T> => {
		const keys = await importKey(this.secretKey);

		if (typeof rawData === 'string') {
			// Text encoder may corrupt a binary data, so we use Base64 to encode bytes
			// Source: https://stackoverflow.com/questions/72528453/why-textencoder-encode-produces-different-result-from-file-arraybuffer#comment128121330_72528453
			const encoder = new TextEncoder();
			return encrypt(encoder.encode(rawData), keys, iv).then(
				bytesToBase64,
			) as Promise<T>;
		}

		return encrypt(rawData, keys, iv) as Promise<T>;
	};

	public decrypt = async <T extends string | ArrayBuffer>(
		encryptedData: T,
	): Promise<T> => {
		const keys = await importKey(this.secretKey);

		if (typeof encryptedData === 'string') {
			// For text decoding we assume a text is Base64 encoded binary data
			const decoder = new TextDecoder('utf-8', { ignoreBOM: true });
			return decrypt(base64ToBytes(encryptedData), keys, iv).then((buffer) =>
				decoder.decode(buffer),
			) as Promise<T>;
		}

		return decrypt(encryptedData, keys, iv) as Promise<T>;
	};
}
