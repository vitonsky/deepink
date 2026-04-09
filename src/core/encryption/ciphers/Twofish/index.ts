import { TwofishModule } from 'twofish';
import twofishModule from 'twofish/twofish.wasm';
import { bytes, struct, u8, u32 } from '@core/encryption/utils/bytes/binstruct';
import { BufferCursor } from '@core/encryption/utils/bytes/BufferCursor';
import { xor16 } from '@core/encryption/utils/xor';

import { CTRCipherMode } from '../../cipherModes/CTRCipherMode';
import { alignBuffer, getBlockPadding } from '../../utils/buffers';
import { HKDFDerivedKeys } from '../../utils/HKDFDerivedKeys';

import { IEncryptionProcessor } from '../..';

export const TWOFISH_IV_SIZE = 12;
export const MASTER_IV_SIZE = 24;
export const TWOFISH_HEADER = struct({
	padding: u8(),
	chunkSize: u32(),
	iv: bytes(MASTER_IV_SIZE),
});

/**
 * Twofish cipher implementation
 */
export class TwofishCTRCipher implements IEncryptionProcessor {
	private readonly chunkSize;
	constructor(
		private readonly key: Uint8Array<ArrayBuffer>,
		private readonly randomBytesGenerator: (
			byteLength: number,
		) => Uint8Array<ArrayBuffer>,
		{ chunkSize }: { chunkSize?: number } = {},
	) {
		const maxChunkSize = CTRCipherMode.getEncryptionLimits(16).maxBytes;
		if (chunkSize === undefined) {
			this.chunkSize = maxChunkSize;
		} else if (chunkSize > maxChunkSize) {
			throw new RangeError(`Chunk size is out of limit ${maxChunkSize}`);
		} else {
			this.chunkSize = chunkSize;
		}
	}

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

		const padding = getBlockPadding(buffer.byteLength, 16);
		const alignedInputLength = buffer.byteLength + padding;

		const output = new ArrayBuffer(TWOFISH_HEADER.size + alignedInputLength);
		const outputWriter = new BufferCursor(output);

		outputWriter.writeBytes(
			TWOFISH_HEADER.encode({ padding, iv, chunkSize: this.chunkSize }),
		);

		const derivedKey = await hkdf.deriveBytes(16, `key`);
		const chunksCount = Math.ceil(alignedInputLength / this.chunkSize);
		const inputReader = new BufferCursor(buffer);
		for (let i = 1; i <= chunksCount; i++) {
			const derivedNonce = await hkdf.deriveBytes(TWOFISH_IV_SIZE, `nonce${i}`);

			const session = tf.createSession(derivedKey);
			try {
				const cipher = new CTRCipherMode(
					(buffer: Uint8Array) => tf.encrypt(session, buffer),
					(a, b) => xor16(xorBuffer, a, b),
				);

				const chunk = inputReader.readBytes(this.chunkSize);
				if (!chunk) throw new RangeError(`Chunk #${i} is not found`);

				const encryptedChunk = await cipher.encrypt(
					alignBuffer(chunk, 16),
					derivedNonce,
				);
				outputWriter.writeBytes(encryptedChunk);
			} finally {
				tf.destroySession(session);
			}
		}

		return output;
	}

	public async decrypt(buffer: ArrayBuffer) {
		const inputReader = new BufferCursor(buffer);

		const header = inputReader.readBytes(TWOFISH_HEADER.size);
		if (!header || header.byteLength !== TWOFISH_HEADER.size)
			throw new RangeError('Cannot read header');

		const { padding, iv, chunkSize } = TWOFISH_HEADER.decode(header);
		if (chunkSize === 0) {
			throw new RangeError('Invalid chunk size in header');
		}

		const tf = await this.getTwofishModule();

		// We preallocate the RAM and re-use it,
		// since only one XOR buffer is used at once,
		// and we synchronously read the result before run next XOR
		const xorBuffer = new Uint8Array(16);

		const hkdf = new HKDFDerivedKeys(this.key, new Uint8Array(iv));

		const payloadSize = inputReader.getRemainingBytes();
		const output = new ArrayBuffer(payloadSize - padding);
		const outputWriter = new BufferCursor(output);

		const derivedKey = await hkdf.deriveBytes(16, `key`);
		const chunksCount = Math.ceil(payloadSize / chunkSize);
		for (let i = 1; i <= chunksCount; i++) {
			const derivedNonce = await hkdf.deriveBytes(TWOFISH_IV_SIZE, `nonce${i}`);

			const session = tf.createSession(derivedKey);
			try {
				const cipher = new CTRCipherMode(
					(buffer: Uint8Array) => tf.encrypt(session, buffer),
					(a, b) => xor16(xorBuffer, a, b),
				);

				const chunkBytes = inputReader.readBytes(chunkSize);
				if (!chunkBytes) throw new RangeError(`Chunk #${i} is not found`);

				const decryptedChunk = await cipher.decrypt(chunkBytes, derivedNonce);

				const isLastChunk = i === chunksCount;
				if (isLastChunk) {
					outputWriter.writeBytes(
						decryptedChunk.slice(0, decryptedChunk.length - padding),
					);
				} else {
					outputWriter.writeBytes(decryptedChunk);
				}
			} finally {
				tf.destroySession(session);
			}
		}

		return output;
	}
}
