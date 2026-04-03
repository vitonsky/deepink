import { TwofishModule } from 'twofish';
import twofishModule from 'twofish/twofish.wasm';
import { bytes, struct, u8 } from '@core/encryption/utils/bytes/binstruct';
import { xor16 } from '@core/encryption/utils/xor';

import { CTRCipherMode } from '../../cipherModes/CTRCipherMode';
import { fillBuffer, joinBuffers } from '../../utils/buffers';

import { IEncryptionProcessor } from '../..';

export const TWOFISH_IV_SIZE = 12;
export const TWOFISH_HEADER = struct({
	padding: u8(),
	iv: bytes(TWOFISH_IV_SIZE),
});

// TODO: implement GCM mode https://en.wikipedia.org/wiki/Galois/Counter_Mode
/**
 * Twofish cipher implementation
 */
export class WasmTwofishCTRCipher implements IEncryptionProcessor {
	constructor(
		private readonly key: Uint8Array,
		private readonly randomBytesGenerator: (
			byteLength: number,
		) => Uint8Array<ArrayBuffer>,
	) {}

	private cipher: Promise<CTRCipherMode> | null = null;
	private getCipher() {
		if (!this.cipher) {
			this.cipher = TwofishModule.load(twofishModule).then((tf) => {
				// TODO: add method to wipe data
				const session = tf.createSession(this.key);

				// We preallocate the RAM and re-use it,
				// since only one XOR buffer is used at once,
				// and we synchronously read the result before run next XOR
				const xorBuffer = new Uint8Array(16);

				return new CTRCipherMode(
					(buffer: Uint8Array) => tf.encrypt(session, buffer),
					(a, b) => xor16(xorBuffer, a, b),
				);
			});
		}

		return this.cipher;
	}

	public async load() {
		await this.getCipher();
	}

	public async encrypt(buffer: ArrayBuffer) {
		const [bufferView, padding] = fillBuffer(new Uint8Array(buffer));

		const iv = this.randomBytesGenerator(TWOFISH_IV_SIZE);

		const cipher = await this.getCipher();
		const encryptedBuffer = await cipher.encrypt(bufferView, iv);

		return joinBuffers([TWOFISH_HEADER.encode({ padding, iv }), encryptedBuffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		const bufferView = new Uint8Array(buffer);
		const { padding, iv } = TWOFISH_HEADER.decode(
			bufferView.subarray(0, TWOFISH_HEADER.size),
		);

		const cipher = await this.getCipher();
		const decryptedBufferWithPaddings = await cipher.decrypt(
			bufferView.subarray(TWOFISH_HEADER.size),
			new Uint8Array(iv),
		);

		const endOfDataOffset = decryptedBufferWithPaddings.byteLength - padding;
		return decryptedBufferWithPaddings.slice(0, endOfDataOffset).buffer;
	}
}
