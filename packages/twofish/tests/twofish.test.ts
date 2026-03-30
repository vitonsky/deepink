/* eslint-disable import/no-unresolved */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { TwofishModule } from '../dist';
import testvectors from './testvectors';

function fromHex(str: string) {
	const l = str.length / 2;
	const out = new Uint8Array(l);
	for (let i = 0; i < l; i++) {
		out[i] = parseInt(str.substr(2 * i, 2), 16);
	}
	return out;
}

function toHex(buf: Uint8Array) {
	return [...buf]
		.map((n) => {
			const h = n.toString(16);
			return h.length === 1 ? '0' + h : h;
		})
		.join('')
		.toUpperCase();
}

describe('Test vectors', () => {
	let tf: TwofishModule;
	beforeAll(async () => {
		tf = await TwofishModule.load(
			readFileSync(resolve(__dirname, '../dist/twofish.wasm')),
		);
	});

	testvectors.forEach(({ keysize, tests }) =>
		describe(`Key size ${keysize}`, () => {
			tests.forEach((data) =>
				test(`Encrypt pt=${data.pt} with key=${data.key}`, () => {
					const session = tf.createSession(fromHex(data.key));
					onTestFinished(() => tf.destroySession(session));

					const result = tf.encrypt(session, fromHex(data.pt));
					expect(toHex(result)).toBe(data.ct);
				}),
			);
		}),
	);
});
