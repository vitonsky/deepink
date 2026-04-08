/* eslint-disable no-bitwise */
/**
 * twofish.ts
 *
 * TypeScript wrapper for the Twofish WASM module.
 * Provides a clean, multi-session API.
 *
 * Usage:
 *   import { TwofishModule } from './twofish';
 *
 *   const tf = await TwofishModule.load('./twofish.wasm');
 *
 *   const session = tf.createSession(key);     // key: Uint8Array, 1–32 bytes
 *   const ct = tf.encrypt(session, plaintext); // plaintext: Uint8Array, 16 bytes
 *   const pt = tf.decrypt(session, ct);        // ciphertext: Uint8Array, 16 bytes
 *   tf.destroySession(session);
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Opaque integer handle for an active Twofish key session. */
export type SessionHandle = number & { readonly __brand: 'TwofishSession' };

/** Raw exports produced by the WASM module. */
interface TwofishWasmExports {
	twofish_init(): number;
	twofish_get_io_buffer(): number;
	twofish_create_session(keyPtr: number, keyLen: number): number;
	twofish_encrypt(handle: number): number;
	twofish_decrypt(handle: number): number;
	twofish_destroy_session(handle: number): number;
	memory: WebAssembly.Memory;
}

// ---------------------------------------------------------------------------
// TwofishModule
// ---------------------------------------------------------------------------

export class TwofishModule {
	private readonly exports: TwofishWasmExports;
	private readonly mem: WebAssembly.Memory;
	private readonly ioOffset: number; // byte offset of io_buffer in WASM memory

	private readonly memView;
	private constructor(exports: TwofishWasmExports) {
		this.exports = exports;
		this.mem = exports.memory;
		this.ioOffset = exports.twofish_get_io_buffer();
		this.memView = new Uint8Array(this.mem.buffer);
	}

	// -----------------------------------------------------------------------
	// Factory
	// -----------------------------------------------------------------------

	/**
	 * Load and initialise the Twofish WASM module.
	 *
	 * @param source  One of:
	 *   - A URL string or URL object pointing at twofish.wasm
	 *   - A BufferSource (ArrayBuffer / Uint8Array) with the raw WASM bytes
	 *
	 * @throws If the WASM cannot be loaded, or if the built-in self-tests fail
	 *         (in which case the WASM module fires an `unreachable` trap).
	 */
	static async load(source: string | URL | BufferSource): Promise<TwofishModule> {
		let wasmInstance: WebAssembly.Instance;

		// Load as files
		if (
			typeof process !== 'undefined' &&
			typeof process.versions.node !== 'undefined'
		) {
			const { readFile } = await import('fs/promises');

			let pathToRead: string | null = null;
			if (typeof source === 'string' && source.startsWith('file://')) {
				pathToRead = new URL(source).pathname;
			} else if (source instanceof URL && source.protocol === 'file:') {
				pathToRead = source.pathname;
			}

			if (pathToRead) {
				source = await readFile(pathToRead);
			}
		}

		if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
			/* We already have the bytes — use the synchronous path. */
			const result = await WebAssembly.instantiate(source as BufferSource);
			wasmInstance = result.instance;
		} else {
			/* URL path — use streaming instantiation when available. */
			if (typeof WebAssembly.instantiateStreaming === 'function') {
				const result = await WebAssembly.instantiateStreaming(
					fetch(source as string),
				);
				wasmInstance = result.instance;
			} else {
				/* Node.js or environments without streaming. */
				const bytes = await TwofishModule.fetchBytes(source);
				const result = await WebAssembly.instantiate(bytes);
				wasmInstance = result.instance;
			}
		}

		const exports = wasmInstance.exports as unknown as TwofishWasmExports;

		/* Run Twofish_initialise() + all built-in self-tests. */
		const ok = exports.twofish_init();
		if (ok !== 1) {
			throw new Error('Twofish: init returned unexpected value');
		}

		return new TwofishModule(exports);
	}

	// -----------------------------------------------------------------------
	// Session management
	// -----------------------------------------------------------------------

	/**
	 * Prepare a key and open a new encryption session.
	 *
	 * @param key  1–32 bytes. Standard sizes are 16, 24, or 32 bytes.
	 *             Shorter keys are zero-padded to the next standard size
	 *             by the Twofish key schedule.
	 *
	 * @returns An opaque SessionHandle. Keep it until you call destroySession().
	 * @throws  On invalid key length or pool exhaustion.
	 */
	createSession(key: Uint8Array): SessionHandle {
		if (key.length < 1 || key.length > 32) {
			throw new RangeError(`Twofish key must be 1–32 bytes, got ${key.length}`);
		}

		/*
		 * We write the key directly into the first key.length bytes of
		 * io_buffer in WASM memory. This is safe as long as the JS caller
		 * doesn't interleave a concurrent encrypt/decrypt call during setup
		 * (which is impossible in a single-threaded JS runtime anyway).
		 */
		const memView = new Uint8Array(this.mem.buffer);
		memView.set(key, this.ioOffset);

		const handle = this.exports.twofish_create_session(this.ioOffset, key.length);

		if (handle === -1) {
			throw new Error('Twofish: session pool exhausted (max 16 sessions)');
		}
		if (handle === -2) {
			throw new RangeError('Twofish: invalid key length reported by WASM');
		}

		/* Wipe the key bytes we just wrote to io_buffer. */
		memView.fill(0, this.ioOffset, this.ioOffset + key.length);

		return handle as SessionHandle;
	}

	// TODO: add method to encrypt and decrypt the same buffer
	// It would remain a performance high, but prevent unexpected mutations
	/**
	 * Encrypt a single 16-byte block.
	 *
	 * **WARNING**: returned buffer is view of WASM memory by performance reasons,
	 * so buffer may be changed anytime.
	 * Copy buffer immediately after return via `.slice()` to prevent mutations
	 *
	 * @param handle     Session handle from createSession().
	 * @param plaintext  Exactly 16 bytes.
	 * @returns          16-byte ciphertext as a new Uint8Array.
	 * @throws           On invalid handle or wrong plaintext length.
	 */
	encrypt(handle: SessionHandle, plaintext: Uint8Array): Uint8Array {
		this.validateBlock(plaintext, 'plaintext');

		/* Write plaintext into io_buffer[0..15]. */
		this.memView.set(plaintext, this.ioOffset);

		const rc = this.exports.twofish_encrypt(handle);
		if (rc !== 0) {
			throw new Error(`Twofish encrypt failed (rc=${rc}, handle=${handle})`);
		}

		/*
		 * Read ciphertext from io_buffer[16..31].
		 * We slice() to get an independent copy — if the WASM memory
		 * ever grows (re-allocated), the view would be detached.
		 */
		return new Uint8Array(this.mem.buffer, this.ioOffset + 16, 16);
	}

	/**
	 * Decrypt a single 16-byte block.
	 *
	 * @param handle      Session handle from createSession().
	 * @param ciphertext  Exactly 16 bytes.
	 * @returns           16-byte plaintext as a new Uint8Array.
	 * @throws            On invalid handle or wrong ciphertext length.
	 */
	decrypt(handle: SessionHandle, ciphertext: Uint8Array): Uint8Array {
		this.validateBlock(ciphertext, 'ciphertext');

		/* Write ciphertext into io_buffer[0..15]. */
		const memView = new Uint8Array(this.mem.buffer);
		memView.set(ciphertext, this.ioOffset);

		const rc = this.exports.twofish_decrypt(handle);
		if (rc !== 0) {
			throw new Error(`Twofish decrypt failed (rc=${rc}, handle=${handle})`);
		}

		/* Read plaintext from io_buffer[16..31]. */
		return new Uint8Array(this.mem.buffer, this.ioOffset + 16, 16).slice();
	}

	/**
	 * Wipe key material and release the session slot back to the pool.
	 * Always call this when you are done with a session.
	 *
	 * @throws On invalid handle.
	 */
	destroySession(handle: SessionHandle): void {
		const rc = this.exports.twofish_destroy_session(handle);
		if (rc !== 0) {
			throw new Error(`Twofish destroySession failed (rc=${rc}, handle=${handle})`);
		}
	}

	// -----------------------------------------------------------------------
	// Block-mode helpers
	// -----------------------------------------------------------------------

	/**
	 * Encrypt multiple 16-byte blocks in ECB mode.
	 *
	 * @param handle     Session handle.
	 * @param plaintext  Must be a multiple of 16 bytes.
	 * @returns          Ciphertext of the same length.
	 */
	encryptECB(handle: SessionHandle, plaintext: Uint8Array): Uint8Array {
		this.validateMultiBlock(plaintext, 'plaintext');
		const out = new Uint8Array(plaintext.length);
		for (let i = 0; i < plaintext.length; i += 16) {
			out.set(this.encrypt(handle, plaintext.subarray(i, i + 16)), i);
		}
		return out;
	}

	/**
	 * Decrypt multiple 16-byte blocks in ECB mode.
	 *
	 * @param handle      Session handle.
	 * @param ciphertext  Must be a multiple of 16 bytes.
	 * @returns           Plaintext of the same length.
	 */
	decryptECB(handle: SessionHandle, ciphertext: Uint8Array): Uint8Array {
		this.validateMultiBlock(ciphertext, 'ciphertext');
		const out = new Uint8Array(ciphertext.length);
		for (let i = 0; i < ciphertext.length; i += 16) {
			out.set(this.decrypt(handle, ciphertext.subarray(i, i + 16)), i);
		}
		return out;
	}

	/**
	 * Encrypt multiple 16-byte blocks in CBC mode.
	 *
	 * @param handle     Session handle.
	 * @param plaintext  Must be a multiple of 16 bytes.
	 * @param iv         Initialisation vector, exactly 16 bytes.
	 * @returns          Ciphertext of the same length as plaintext.
	 */
	encryptCBC(handle: SessionHandle, plaintext: Uint8Array, iv: Uint8Array): Uint8Array {
		this.validateBlock(iv, 'IV');
		this.validateMultiBlock(plaintext, 'plaintext');

		const out = new Uint8Array(plaintext.length);
		let prev = iv.slice(); /* previous ciphertext block (starts as IV) */

		for (let i = 0; i < plaintext.length; i += 16) {
			/* XOR plaintext block with previous ciphertext block. */
			const block = plaintext.subarray(i, i + 16).slice();
			for (let j = 0; j < 16; j++) block[j] ^= prev[j];

			const ct = this.encrypt(handle, block);
			out.set(ct, i);
			prev = ct as Uint8Array<ArrayBuffer>;
		}
		return out;
	}

	/**
	 * Decrypt multiple 16-byte blocks in CBC mode.
	 *
	 * @param handle      Session handle.
	 * @param ciphertext  Must be a multiple of 16 bytes.
	 * @param iv          Initialisation vector, exactly 16 bytes.
	 * @returns           Plaintext of the same length as ciphertext.
	 */
	decryptCBC(
		handle: SessionHandle,
		ciphertext: Uint8Array,
		iv: Uint8Array,
	): Uint8Array {
		this.validateBlock(iv, 'IV');
		this.validateMultiBlock(ciphertext, 'ciphertext');

		const out = new Uint8Array(ciphertext.length);
		let prev = iv.slice();

		for (let i = 0; i < ciphertext.length; i += 16) {
			const block = ciphertext.subarray(i, i + 16);
			const pt = this.decrypt(handle, block);

			/* XOR decrypted block with previous ciphertext block. */
			for (let j = 0; j < 16; j++) pt[j] ^= prev[j];
			out.set(pt, i);
			prev = block.slice();
		}
		return out;
	}

	// -----------------------------------------------------------------------
	// Private helpers
	// -----------------------------------------------------------------------

	private validateBlock(data: Uint8Array, name: string): void {
		if (data.length !== 16) {
			throw new RangeError(
				`Twofish ${name} must be exactly 16 bytes, got ${data.length}`,
			);
		}
	}

	private validateMultiBlock(data: Uint8Array, name: string): void {
		if (data.length === 0 || data.length % 16 !== 0) {
			throw new RangeError(
				`Twofish ${name} must be a non-empty multiple of 16 bytes, got ${data.length}`,
			);
		}
	}

	/** Simple fetch-to-ArrayBuffer for Node.js / environments without streaming. */
	private static async fetchBytes(source: string | URL): Promise<ArrayBuffer> {
		/* Node.js 18+ has global fetch. Older Node needs fs.readFile. */
		if (typeof fetch !== 'undefined') {
			return (await fetch(source as string)).arrayBuffer();
		}

		/* Node.js fallback using fs/promises */
		const fs = await import('fs/promises');
		const buf = await fs.readFile(source instanceof URL ? source.pathname : source);
		return buf.buffer;
	}
}
