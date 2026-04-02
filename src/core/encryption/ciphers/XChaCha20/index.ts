/* eslint-disable camelcase */
import sodium from 'libsodium-wrappers-sumo';
import { IEncryptionProcessor } from '@core/encryption';
import { struct, u32, u64 } from '@core/encryption/utils/bytes/binstruct';
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
	chunkSize: u32(),
	length: u64(),
});

// TODO: provide custom random generator
export class XChaCha20Cipher implements IEncryptionProcessor {
	private readonly chunkSize;
	constructor(
		private readonly key: Uint8Array,
		readonly config: { chunkSize?: number } = {},
	) {
		this.chunkSize = config.chunkSize ?? 4096;
	}

	public async encrypt(buffer: ArrayBuffer) {
		await sodium.ready;

		// Allocate output buffer as buffer size + chunks overhead + header size
		const chunksCount = Math.ceil(buffer.byteLength / this.chunkSize);
		const outBuffer = new Uint8Array(
			ChaChaHeader.size +
				buffer.byteLength +
				chunksCount * sodium.crypto_secretstream_xchacha20poly1305_ABYTES +
				sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES,
		);

		const input = new BufferCursor(buffer);
		const output = new BufferCursor(outBuffer.buffer);

		output.writeBytes(
			ChaChaHeader.encode({
				length: BigInt(buffer.byteLength),
				chunkSize: this.chunkSize,
			}),
		);

		// Start encryption
		const { state: state_out, header } =
			sodium.crypto_secretstream_xchacha20poly1305_init_push(this.key);

		output.writeBytes(header);
		while (true) {
			const chunkBytes = input.readBytes(this.chunkSize);

			// We break the loop below, when no more bytes remains in reader
			// So if we can't read bytes here, it is unexpected and it is critical situation
			if (chunkBytes === null) throw new Error('Unexpected end of input buffer');

			const isLastChunk = input.getRemainingBytes() === 0;
			const encryptedBytes = sodium.crypto_secretstream_xchacha20poly1305_push(
				state_out,
				chunkBytes,
				null,
				isLastChunk
					? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
					: sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE,
			);

			output.writeBytes(encryptedBytes);

			if (isLastChunk) break;
		}

		return outBuffer.buffer;
	}

	public async decrypt(buffer: ArrayBuffer) {
		await sodium.ready;

		const input = new BufferCursor(buffer);

		const metaHeader = input.readBytes(ChaChaHeader.size);
		if (!metaHeader) throw RangeError('Cannot read meta header');
		const meta = ChaChaHeader.decode(metaHeader);

		// Allocate an output buffer
		const outBuffer = new Uint8Array(Number(meta.length)).buffer;
		const output = new BufferCursor(outBuffer);

		const cipherHeader = input.readBytes(
			sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES,
		);
		if (
			!cipherHeader ||
			cipherHeader.byteLength !==
				sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES
		)
			throw new Error('Cannot read sodium header');

		// Decrypt data
		const state_in = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
			cipherHeader,
			this.key,
		);

		while (true) {
			const bytes = input.readBytes(
				meta.chunkSize + sodium.crypto_secretstream_xchacha20poly1305_ABYTES,
			);

			// End of data
			if (bytes === null) break;

			const r = sodium.crypto_secretstream_xchacha20poly1305_pull(
				state_in,
				bytes,
				null,
			);

			if (!r) throw new Error('Unexpected response from sodium');

			output.writeBytes(r.message);
		}

		return outBuffer.slice(0);
	}
}
