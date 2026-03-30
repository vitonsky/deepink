import { init, SerpentCtr, SerpentStreamPool } from 'leviathan-crypto';
import { IEncryptionProcessor, RandomBytesGenerator } from '@core/encryption';
import { fillBuffer, joinBuffers } from '@core/encryption/utils/buffers';

import { transformBuffer, TwofishBufferHeader } from '../Twofish';

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

const binHeader = new TwofishBufferHeader(16);

const chunkSize = 65536;

export class SeprentCipher implements IEncryptionProcessor {
	constructor(
		private readonly key: Uint8Array,
		private readonly getRandomBytes: RandomBytesGenerator,
	) {}

	public async encrypt(buffer: ArrayBuffer) {
		await ensureWasmIsLoaded();

		const [bufferView, padding] = fillBuffer(new Uint8Array(buffer));

		const nonce = this.getRandomBytes(16).buffer;

		const cipher = new SerpentCtr({ dangerUnauthenticated: true });
		cipher.beginEncrypt(this.key, new Uint8Array(nonce));
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

		return joinBuffers([
			binHeader.createBuffer({ iv: nonce, padding }),
			encryptedBuffer,
		]);
	}

	public async decrypt(buffer: ArrayBuffer) {
		await ensureWasmIsLoaded();

		const { iv, padding } = binHeader.readBuffer(
			buffer.slice(0, binHeader.bufferSize),
		);

		const cipher = new SerpentCtr({ dangerUnauthenticated: true });
		cipher.beginEncrypt(this.key, new Uint8Array(iv));
		const decryptedBuffer = transformBuffer(
			new Uint8Array(buffer.slice(binHeader.bufferSize)),
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

export class SeprentStream implements IEncryptionProcessor {
	constructor(private readonly key: Uint8Array) {}

	private pool: Promise<SerpentStreamPool> | null = null;
	private getPool() {
		if (!this.pool) {
			this.pool = ensureWasmIsLoaded().then(async () => {
				return SerpentStreamPool.create({
					workers: navigator.hardwareConcurrency,
				});
			});
		}

		return this.pool;
	}

	public async encrypt(buffer: ArrayBuffer) {
		const pool = await this.getPool();

		const result = await pool.seal(this.key, new Uint8Array(buffer), chunkSize);
		return result.slice().buffer;
	}

	public async decrypt(buffer: ArrayBuffer) {
		const pool = await this.getPool();

		const result = await pool.open(this.key, new Uint8Array(buffer));
		return result.slice().buffer;
	}
}
