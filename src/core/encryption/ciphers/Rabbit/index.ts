import CryptoJS from 'crypto-js';

import { ICipher } from '../..';

// Source https://github.com/brix/crypto-js/issues/274#issuecomment-600039187
function CryptJsWordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray) {
	/* eslint-disable no-bitwise */
	const l = wordArray.sigBytes;
	const words = wordArray.words;
	const result = new Uint8Array(l);
	let i = 0 /*dst*/,
		j = 0; /*src*/
	while (true) {
		// here i is a multiple of 4
		if (i == l) break;
		const w = words[j++];
		result[i++] = (w & 0xff000000) >>> 24;
		if (i == l) break;
		result[i++] = (w & 0x00ff0000) >>> 16;
		if (i == l) break;
		result[i++] = (w & 0x0000ff00) >>> 8;
		if (i == l) break;
		result[i++] = w & 0x000000ff;
	}
	/* eslint-enable no-bitwise */

	return result.buffer;
}

/**
 * WARNING: not stable - cipher crash Chromium browser for files more than 30 Mb
 */
export class RabbitCipher implements ICipher {
	private readonly key;
	constructor(cipher: string) {
		this.key = cipher;
	}

	public async encrypt(buffer: ArrayBuffer) {
		// Cast type, because library supports `ArrayBuffer`, but types are incorrect
		const cipherResult = CryptoJS.Rabbit.encrypt(
			CryptoJS.lib.WordArray.create(buffer as unknown as number[]),
			this.key,
		).toString(CryptoJS.format.OpenSSL);
		return new TextEncoder().encode(cipherResult).buffer;
	}

	public async decrypt(buffer: ArrayBuffer) {
		const cipherResult = new TextDecoder('utf-8').decode(buffer);
		const wordArray = CryptoJS.Rabbit.decrypt(
			CryptoJS.format.OpenSSL.parse(cipherResult),
			this.key,
		);
		return CryptJsWordArrayToUint8Array(wordArray);
	}
}
