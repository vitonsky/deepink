import { init, SerpentCtr } from 'leviathan-crypto';
import { IEncryptionProcessor, RandomBytesGenerator } from '@core/encryption';
import { fillBuffer, joinBuffers } from '@core/encryption/utils/buffers';
import { bytes, struct, u8 } from '@core/encryption/utils/bytes/binstruct';

/**
 * Inner util to transform block with cipher
 * Util creates a new buffer instead of mutate original buffer.
 */
export function transformBuffer(
	buffer: Uint8Array,
	transformBlock: (offset: number, input: Uint8Array, output: Uint8Array) => void,
	blockSize = 16,
) {
	const out = new Uint8Array(buffer.length);
	for (let offset = 0; offset < buffer.length; offset += blockSize) {
		transformBlock(offset, buffer, out);
	}

	return out;
}

let initStatus: boolean | Promise<void>;
export async function ensureWasmIsLoaded() {
	if (!initStatus) {
		initStatus = init(['serpent', 'sha2']);
	}

	// Done
	if (initStatus === true) return;

	// Wait
	await initStatus;
}

export const SERPENT_IV_SIZE = 16;
export const SERPENT_HEADER = struct({
	padding: u8(),
	iv: bytes(SERPENT_IV_SIZE),
});

const chunkSize = 65536;

export class SeprentCipher implements IEncryptionProcessor {
	constructor(
		private readonly key: Uint8Array,
		private readonly getRandomBytes: RandomBytesGenerator,
	) {}

	public async encrypt(buffer: ArrayBuffer) {
		await ensureWasmIsLoaded();

		const iv = this.getRandomBytes(SERPENT_IV_SIZE);
		const [bufferView, padding] = fillBuffer(new Uint8Array(buffer));

		const cipher = new SerpentCtr({ dangerUnauthenticated: true });
		cipher.beginEncrypt(this.key, iv);
		const encryptedBuffer = transformBuffer(
			bufferView,
			(offset, input, output) => {
				output.set(
					cipher.encryptChunk(input.slice(offset, offset + chunkSize)),
					offset,
				);
			},
			chunkSize,
		);
		cipher.dispose();

		return joinBuffers([SERPENT_HEADER.encode({ padding, iv }), encryptedBuffer]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		await ensureWasmIsLoaded();

		const bufferView = new Uint8Array(buffer);
		const { padding, iv } = SERPENT_HEADER.decode(
			bufferView.subarray(0, SERPENT_HEADER.size),
		);

		const cipher = new SerpentCtr({ dangerUnauthenticated: true });
		cipher.beginEncrypt(this.key, iv);
		const decryptedBuffer = transformBuffer(
			bufferView.subarray(SERPENT_HEADER.size),
			(offset, input, output) => {
				output.set(
					cipher.decryptChunk(input.slice(offset, offset + chunkSize)),
					offset,
				);
			},
			chunkSize,
		);
		cipher.dispose();

		return decryptedBuffer.slice(0, decryptedBuffer.length - padding).buffer;
	}
}
