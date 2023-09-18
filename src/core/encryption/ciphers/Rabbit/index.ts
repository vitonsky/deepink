import CryptoJS from 'crypto-js';

import { base64ToBytes, bytesToBase64 } from '../../encoding';

import { ICipher } from '../..';

export class RabbitCipher implements ICipher {
	private readonly key;
	constructor(cipher: string) {
		this.key = cipher;
	}

	public async encrypt(buffer: ArrayBuffer) {
		const b64 = bytesToBase64(buffer);
		const cipherResult = CryptoJS.Rabbit.encrypt(b64, this.key).toString(
			CryptoJS.format.OpenSSL,
		);
		return new TextEncoder().encode(cipherResult).buffer;
	}

	public async decrypt(buffer: ArrayBuffer) {
		const cipherResult = new TextDecoder('utf-8').decode(buffer);
		const wordArray = CryptoJS.Rabbit.decrypt(
			CryptoJS.format.OpenSSL.parse(cipherResult),
			this.key,
		);
		const b64 = wordArray.toString(CryptoJS.enc.Utf8);
		return base64ToBytes(b64);
	}
}
