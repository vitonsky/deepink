/* eslint-disable no-bitwise */
function hex(hex: string): Uint8Array<ArrayBuffer> {
	return new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
}

function incrementCounter(counter: Uint8Array, n: number): Uint8Array<ArrayBuffer> {
	const c = new Uint8Array(counter);
	let carry = n;
	for (let i = 15; i >= 12; i--) {
		// last 4 bytes
		const sum = c[i] + carry;
		c[i] = sum & 0xff;
		carry = sum >> 8;
	}
	return c;
}

// Source: https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-38a.pdf

describe('AES-128-CTR NIST SP 800-38A multi-block', () => {
	const key = hex('2b7e151628aed2a6abf7158809cf4f3c');
	const iv = hex('f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff');
	const plaintextBlocks = [
		'6bc1bee22e409f96e93d7e117393172a',
		'ae2d8a571e03ac9c9eb76fac45af8e51',
		'30c81c46a35ce411e5fbc1191a0a52ef',
		'f69f2445df4f9b17ad2b417be66c3710',
	].map(hex);
	const expectedCiphertextBlocks = [
		'874d6191b620e3261bef6864990db6ce',
		'9806f66b7970fdff8617187bb9fffdff',
		'5ae4df3edbd5d35e5b4f09020db03eab',
		'1e031dda2fbe03d1792170a0f3009cee',
	].map(hex);

	it('matches all 4 blocks with proper counter increment', async () => {
		const cryptoKey = await crypto.subtle.importKey(
			'raw',
			key,
			{ name: 'AES-CTR' },
			false,
			['encrypt'],
		);

		for (let i = 0; i < plaintextBlocks.length; i++) {
			const counter = incrementCounter(iv, i);
			const result = new Uint8Array(
				await crypto.subtle.encrypt(
					{ name: 'AES-CTR', counter, length: 128 },
					cryptoKey,
					plaintextBlocks[i],
				),
			);
			expect(result).toEqual(expectedCiphertextBlocks[i]);
		}
	});
});
