import { TwofishModule } from 'twofish';
import twofishModule from 'twofish/twofish.wasm';
import { bytes, struct, u8 } from '@core/encryption/utils/bytes/binstruct';
import { xor16 } from '@core/encryption/utils/xor';

import { CTRCipherMode } from '../../cipherModes/CTRCipherMode';
import { fillBuffer } from '../../utils/buffers';

import { IEncryptionProcessor } from '../..';

export class HKDFDerivedKeys {
	private readonly key;
	constructor(
		key: Uint8Array<ArrayBuffer>,
		private readonly iv: Uint8Array<ArrayBuffer>,
	) {
		this.key = crypto.subtle.importKey('raw', key, 'HKDF', false, [
			'deriveKey',
			'deriveBits',
		]);
	}

	public stringToBuffer(text: string) {
		return new TextEncoder().encode(text);
	}

	public async deriveBits(length: number, context: string | Uint8Array<ArrayBuffer>) {
		const key = await this.key;

		return await crypto.subtle.deriveBits(
			{
				name: 'HKDF',
				hash: 'SHA-256',
				salt: this.iv,
				info:
					typeof context === 'string' ? this.stringToBuffer(context) : context,
			},
			key,
			length,
		);
	}

	public async deriveBytes(length: number, context: string | Uint8Array<ArrayBuffer>) {
		const buffer = await this.deriveBits(length * 8, context);
		return new Uint8Array(buffer);
	}
}

export const TWOFISH_IV_SIZE = 12;
export const MASTER_IV_SIZE = 24;
export const TWOFISH_HEADER = struct({
	padding: u8(),
	iv: bytes(MASTER_IV_SIZE),
});

// TODO: implement GCM mode https://en.wikipedia.org/wiki/Galois/Counter_Mode
/**
 * Twofish cipher implementation
 */
export class WasmTwofishCTRCipher implements IEncryptionProcessor {
	private readonly chunkSize = CTRCipherMode.getEncryptionLimits(16).maxBytes;
	constructor(
		private readonly key: Uint8Array<ArrayBuffer>,
		private readonly randomBytesGenerator: (
			byteLength: number,
		) => Uint8Array<ArrayBuffer>,
	) {}

	private tfModule: Promise<TwofishModule> | null = null;
	private getTwofishModule() {
		if (!this.tfModule) {
			this.tfModule = TwofishModule.load(twofishModule);
		}

		return this.tfModule;
	}

	public async load() {
		await this.getTwofishModule();
	}

	public async encrypt(buffer: ArrayBuffer) {
		const tf = await this.getTwofishModule();

		// We preallocate the RAM and re-use it,
		// since only one XOR buffer is used at once,
		// and we synchronously read the result before run next XOR
		const xorBuffer = new Uint8Array(16);

		const iv = this.randomBytesGenerator(MASTER_IV_SIZE);
		const hkdf = new HKDFDerivedKeys(this.key, iv);

		const [input, padding] = fillBuffer(new Uint8Array(buffer));

		const output = new Uint8Array(
			new ArrayBuffer(TWOFISH_HEADER.size + input.length),
		);
		output.set(TWOFISH_HEADER.encode({ padding, iv }), 0);
		const encryptedData = output.subarray(TWOFISH_HEADER.size);

		const derivedKey = await hkdf.deriveBytes(16, `key`);
		const chunksCount = Math.ceil(input.byteLength / this.chunkSize);
		for (let i = 0; i < chunksCount; i++) {
			const derivedNonce = await hkdf.deriveBytes(TWOFISH_IV_SIZE, `nonce${i}`);

			const session = tf.createSession(derivedKey);
			try {
				const cipher = new CTRCipherMode(
					(buffer: Uint8Array) => tf.encrypt(session, buffer),
					(a, b) => xor16(xorBuffer, a, b),
				);

				const offset = this.chunkSize * i;
				const encryptedChunk = await cipher.encrypt(
					input.subarray(offset, offset + this.chunkSize),
					derivedNonce,
				);
				encryptedData.set(encryptedChunk, offset);
			} finally {
				tf.destroySession(session);
			}
		}

		return output.buffer;
	}

	public async decrypt(buffer: ArrayBuffer) {
		const { padding, iv } = TWOFISH_HEADER.decode(
			new Uint8Array(buffer, 0, TWOFISH_HEADER.size),
		);

		const tf = await this.getTwofishModule();

		// We preallocate the RAM and re-use it,
		// since only one XOR buffer is used at once,
		// and we synchronously read the result before run next XOR
		const xorBuffer = new Uint8Array(16);

		const hkdf = new HKDFDerivedKeys(this.key, new Uint8Array(iv));

		const input = new Uint8Array(buffer, TWOFISH_HEADER.size);
		const output = new Uint8Array(input.length - padding);
		const derivedKey = await hkdf.deriveBytes(16, `key`);
		const chunksCount = Math.ceil(input.byteLength / this.chunkSize);
		for (let i = 0; i < chunksCount; i++) {
			const derivedNonce = await hkdf.deriveBytes(TWOFISH_IV_SIZE, `nonce${i}`);

			const session = tf.createSession(derivedKey);
			try {
				const cipher = new CTRCipherMode(
					(buffer: Uint8Array) => tf.encrypt(session, buffer),
					(a, b) => xor16(xorBuffer, a, b),
				);

				const offset = this.chunkSize * i;
				const decryptedChunk = await cipher.decrypt(
					input.subarray(offset, offset + this.chunkSize),
					derivedNonce,
				);

				const isLastChunk = i === chunksCount - 1;
				if (isLastChunk) {
					output.set(
						decryptedChunk.slice(0, decryptedChunk.length - padding),
						offset,
					);
				} else {
					output.set(decryptedChunk, offset);
				}
			} finally {
				tf.destroySession(session);
			}
		}

		return output.buffer;
	}
}
