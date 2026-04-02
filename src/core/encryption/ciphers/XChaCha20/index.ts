import sodium from 'libsodium-wrappers-sumo';
import { IEncryptionProcessor, RandomBytesGenerator } from '@core/encryption';
import { bytes, struct, u32, u64 } from '@core/encryption/utils/bytes/binstruct';
import { BufferCursor } from '@core/encryption/utils/bytes/BufferCursor';

const emptyCounter = new Uint8Array(4);

export class XChaCha20Poly1305 {
	private readonly key;
	private readonly nonce;
	constructor(key: Uint8Array, iv: Uint8Array, hChaCha20Const?: Uint8Array) {
		// Derive a key
		this.key = sodium.crypto_core_hchacha20(
			new Uint8Array(iv).slice(0, 16),
			key,
			hChaCha20Const ?? null,
		);

		this.nonce = new Uint8Array(12);
		this.nonce.set(new Uint8Array(iv).slice(16), 4);
	}

	/**
	 * Load WASM module
	 */
	public load() {
		return sodium.ready;
	}

	public dispose() {
		sodium.memzero(this.key);
		sodium.memzero(this.nonce);
	}

	public encrypt(
		plaintext: Uint8Array,
		{ aad, counter }: { aad?: Uint8Array; counter?: Uint8Array } = {},
	) {
		const nonce = this.nonce;
		nonce.set(counter ? counter : emptyCounter);

		return sodium.crypto_aead_chacha20poly1305_ietf_encrypt_detached(
			plaintext,
			aad ?? null,
			null,
			nonce,
			this.key,
		);
	}

	public decrypt(
		ciphertext: Uint8Array,
		mac: Uint8Array,
		{ aad, counter }: { aad?: Uint8Array; counter?: Uint8Array } = {},
	) {
		const nonce = this.nonce;
		nonce.set(counter ? counter : emptyCounter);

		return sodium.crypto_aead_chacha20poly1305_ietf_decrypt_detached(
			null,
			ciphertext,
			mac,
			aad ?? null,
			nonce,
			this.key,
		);
	}
}

const ChaChaHeader = struct({
	nonce: bytes(24),
	chunkSize: u32(),
	length: u64(),
});

const createCounter = () => {
	const buffer = new Uint8Array(4);
	const view = new DataView(buffer.buffer);
	const increment = () => {
		view.setUint32(0, view.getUint32(0) + 1);
	};

	return { buffer, view, increment };
};

const TAG_SIZE = 16;

export class XChaCha20Cipher implements IEncryptionProcessor {
	private readonly chunkSize;
	constructor(
		private readonly key: Uint8Array,
		private readonly randomBytes: RandomBytesGenerator,
		readonly config: { chunkSize?: number } = {},
	) {
		this.chunkSize = config.chunkSize ?? 4096;
	}

	public async encrypt(buffer: ArrayBuffer) {
		const nonce = this.randomBytes(24);
		const cipher = new XChaCha20Poly1305(this.key, nonce);

		try {
			await cipher.load();

			// Allocate output buffer as buffer size + chunks overhead + header size
			const chunksCount = Math.ceil(buffer.byteLength / this.chunkSize);
			const outBuffer = new Uint8Array(
				ChaChaHeader.size + buffer.byteLength + chunksCount * TAG_SIZE,
			);

			const input = new BufferCursor(buffer);
			const output = new BufferCursor(outBuffer.buffer);

			output.writeBytes(
				ChaChaHeader.encode({
					nonce,
					length: BigInt(buffer.byteLength),
					chunkSize: this.chunkSize,
				}),
			);

			// Start encryption
			const counter = createCounter();
			while (true) {
				const chunkBytes = input.readBytes(this.chunkSize);

				// We break the loop below, when no more bytes remains in reader
				// So if we can't read bytes here, it is unexpected and it is critical situation
				if (chunkBytes === null)
					throw new Error('Unexpected end of input buffer');

				const isLastChunk = input.getRemainingBytes() === 0;

				// TODO: add final tag (aad)
				const { ciphertext, mac } = cipher.encrypt(chunkBytes, {
					counter: counter.buffer,
				});
				output.writeBytes(ciphertext);
				output.writeBytes(mac);

				if (isLastChunk) break;
				counter.increment();
			}

			return outBuffer.buffer;
		} catch (error) {
			cipher.dispose();
			throw error;
		}
	}

	public async decrypt(buffer: ArrayBuffer) {
		const input = new BufferCursor(buffer);

		const metaHeader = input.readBytes(ChaChaHeader.size);
		if (!metaHeader) throw RangeError('Cannot read meta header');
		const meta = ChaChaHeader.decode(metaHeader);

		// Allocate an output buffer
		const outBuffer = new Uint8Array(Number(meta.length)).buffer;
		const output = new BufferCursor(outBuffer);

		// Decrypt data
		const cipher = new XChaCha20Poly1305(this.key, meta.nonce);
		const counter = createCounter();
		while (true) {
			const bytes = input.readBytes(meta.chunkSize + TAG_SIZE);

			// End of data
			if (bytes === null) break;

			const dataBytesLen = bytes.byteLength - TAG_SIZE;
			if (0 > dataBytesLen) throw new RangeError('Too short chunk');

			const data = bytes.subarray(0, dataBytesLen);
			const mac = bytes.subarray(dataBytesLen);

			const plaintext = cipher.decrypt(data, mac, { counter: counter.buffer });
			counter.increment();

			output.writeBytes(plaintext);
		}

		return outBuffer.slice(0);
	}
}
