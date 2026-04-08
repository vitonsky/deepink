import { init, SerpentCtr } from 'leviathan-crypto';
import { IEncryptionProcessor, RandomBytesGenerator } from '@core/encryption';
import { getBlockPadding } from '@core/encryption/utils/buffers';
import { bytes, struct, u8 } from '@core/encryption/utils/bytes/binstruct';
import { BufferCursor } from '@core/encryption/utils/bytes/BufferCursor';

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

export class SerpentCipher implements IEncryptionProcessor {
	constructor(
		private readonly key: Uint8Array,
		private readonly getRandomBytes: RandomBytesGenerator,
	) {}

	public async encrypt(buffer: ArrayBuffer) {
		await ensureWasmIsLoaded();
		const inputReader = new BufferCursor(buffer);

		const padding = getBlockPadding(buffer.byteLength, 16);
		const iv = this.getRandomBytes(SERPENT_IV_SIZE);

		const output = new ArrayBuffer(SERPENT_HEADER.size + buffer.byteLength + padding);
		const outputWriter = new BufferCursor(output);

		outputWriter.writeBytes(SERPENT_HEADER.encode({ padding, iv }));

		const cipher = new SerpentCtr({ dangerUnauthenticated: true });
		cipher.beginEncrypt(this.key, iv);

		let chunk;
		while ((chunk = inputReader.readBytes(chunkSize))) {
			// Align the chunk
			const requiredPadding = getBlockPadding(chunk.byteLength, 16);
			if (requiredPadding !== 0) {
				if (requiredPadding !== padding)
					throw new RangeError(
						`Unexpected chunk size ${chunk.byteLength}. Expected padding is ${padding}, required padding is ${requiredPadding}`,
					);

				const chunkContent = chunk;
				chunk = new Uint8Array(chunkContent.byteLength + requiredPadding);
				chunk.set(new Uint8Array(chunkContent), 0);
			}

			outputWriter.writeBytes(cipher.encryptChunk(chunk));
		}

		cipher.dispose();

		return output;
	}

	public async decrypt(buffer: ArrayBuffer) {
		await ensureWasmIsLoaded();

		const inputReader = new BufferCursor(buffer);
		const header = inputReader.readBytes(SERPENT_HEADER.size);
		if (!header || header.byteLength !== SERPENT_HEADER.size)
			throw new RangeError('Cannot read header');

		const { padding, iv } = SERPENT_HEADER.decode(header);

		if (inputReader.getRemainingBytes() % 16 !== 0)
			throw new RangeError(
				`Buffer payload is not aligned to 16 bytes. The actual size is ${inputReader.getRemainingBytes()}`,
			);

		const output = new ArrayBuffer(buffer.byteLength - padding - SERPENT_HEADER.size);
		const outputWriter = new BufferCursor(output);

		const cipher = new SerpentCtr({ dangerUnauthenticated: true });
		cipher.beginDecrypt(this.key, iv);

		let chunk;
		while ((chunk = inputReader.readBytes(chunkSize))) {
			const pt = cipher.encryptChunk(chunk);

			const isLastChunk = inputReader.getRemainingBytes() === 0;
			if (isLastChunk) {
				outputWriter.writeBytes(pt.subarray(0, pt.length - padding));
			} else {
				outputWriter.writeBytes(pt);
			}
		}

		cipher.dispose();

		return output;
	}
}
