/* eslint-disable import/no-unresolved */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { TwofishModule } from '../dist';

let tf: TwofishModule;

beforeAll(async () => {
	tf = await TwofishModule.load(
		readFileSync(resolve(__dirname, '../dist/twofish.wasm')),
	);
});

// -----------------------------------------------------------------------
// Invalid key length — twofish_create_session returns -2
// -----------------------------------------------------------------------
test('createSession throws on zero-length key', () => {
	expect(() => tf.createSession(new Uint8Array(0))).toThrow();
});

test('createSession throws on key longer than 32 bytes', () => {
	expect(() => tf.createSession(new Uint8Array(33))).toThrow();
});

// -----------------------------------------------------------------------
// Session pool exhaustion — twofish_create_session returns -1
// MAX_SESSIONS = 16
// -----------------------------------------------------------------------
test('createSession throws when all 16 session slots are occupied', () => {
	const sessions: ReturnType<TwofishModule['createSession']>[] = [];
	const key = new Uint8Array(32).fill(0xab);

	try {
		for (let i = 0; i < 16; i++) {
			sessions.push(tf.createSession(key));
		}
		// The 17th attempt must throw (pool is full)
		expect(() => tf.createSession(key)).toThrow();
	} finally {
		// Always clean up so we don't poison other tests
		sessions.forEach((s) => tf.destroySession(s));
	}
});

// -----------------------------------------------------------------------
// Operations on a destroyed (invalid) handle
// twofish_encrypt / twofish_decrypt / twofish_destroy_session return -1
// -----------------------------------------------------------------------
test('encrypt throws when called with a destroyed session handle', () => {
	const key = new Uint8Array(32).fill(0x01);
	const session = tf.createSession(key);
	tf.destroySession(session);

	expect(() => tf.encrypt(session, new Uint8Array(16))).toThrow();
});

test('decrypt throws when called with a destroyed session handle', () => {
	const key = new Uint8Array(32).fill(0x02);
	const session = tf.createSession(key);
	tf.destroySession(session);

	expect(() => tf.decrypt(session, new Uint8Array(16))).toThrow();
});

test('destroySession throws when called twice on the same handle', () => {
	const key = new Uint8Array(32).fill(0x03);
	const session = tf.createSession(key);
	tf.destroySession(session);

	expect(() => tf.destroySession(session)).toThrow();
});
