/* eslint-disable no-bitwise */
/* eslint-disable @cspell/spellchecker */
import sodium from 'libsodium-wrappers-sumo';

import { XChaCha20Poly1305 } from '.';

describe('draft-arciszewski-xchacha-01', () => {
	// Source: https://www.potaroo.net/ietf/all-ids/draft-arciszewski-xchacha-01.html

	test('HChaCha20 test vectors', async () => {
		// Source: https://www.potaroo.net/ietf/all-ids/draft-arciszewski-xchacha-01.html#rfc.section.2.2.1
		await sodium.ready;

		const key = Uint8Array.from([
			0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
			0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,
			0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
		]);

		const nonce = Uint8Array.from([
			0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x4a, 0x00, 0x00, 0x00, 0x00, 0x31,
			0x41, 0x59, 0x27,
		]);

		expect(sodium.crypto_core_hchacha20(nonce, key, null)).toStrictEqual(
			Uint8Array.from([
				0x82, 0x41, 0x3b, 0x42, 0x27, 0xb2, 0x7b, 0xfe, 0xd3, 0x0e, 0x42, 0x50,
				0x8a, 0x87, 0x7d, 0x73, 0xa0, 0xf9, 0xe4, 0xd5, 0x8a, 0x74, 0xa8, 0x53,
				0xc1, 0x2e, 0xc4, 0x13, 0x26, 0xd3, 0xec, 0xdc,
			]),
		);
	});

	test('XChaCha20', async () => {
		await sodium.ready;

		const plaintext = Buffer.from(
			`5468652064686f6c65202870726f6e6f756e6365642022646f6c65222920697320616c736f206b6e6f776e2061732074686520417369617469632077696c6420646f672c2072656420646f672c20616e642077686973746c696e6720646f672e2049742069732061626f7574207468652073697a65206f662061204765726d616e20736865706865726420627574206c6f6f6b73206d6f7265206c696b652061206c6f6e672d6c656767656420666f782e205468697320686967686c7920656c757369766520616e6420736b696c6c6564206a756d70657220697320636c6173736966696564207769746820776f6c7665732c20636f796f7465732c206a61636b616c732c20616e6420666f78657320696e20746865207461786f6e6f6d69632066616d696c792043616e696461652e`,
			'hex',
		);

		expect(plaintext.toString('ascii')).toBe(
			`The dhole (pronounced "dole") is also known as the Asiatic wild dog, red dog, and whistling dog. It is about the size of a German shepherd but looks more like a long-legged fox. This highly elusive and skilled jumper is classified with wolves, coyotes, jackals, and foxes in the taxonomic family Canidae.`,
		);

		const key = Buffer.from(
			`808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f`,
			'hex',
		);

		const iv = Buffer.from(`404142434445464748494a4b4c4d4e4f5051525354555658`, 'hex');
		expect(iv.toString('ascii')).toBe(`@ABCDEFGHIJKLMNOPQRSTUVX`);

		const expectedCt = Buffer.from(
			`4559abba4e48c16102e8bb2c05e6947f50a786de162f9b0b7e592a9b53d0d4e98d8d6410d540a1a6375b26d80dace4fab52384c731acbf16a5923c0c48d3575d4d0d2c673b666faa731061277701093a6bf7a158a8864292a41c48e3a9b4c0daece0f8d98d0d7e05b37a307bbb66333164ec9e1b24ea0d6c3ffddcec4f68e7443056193a03c810e11344ca06d8ed8a2bfb1e8d48cfa6bc0eb4e2464b748142407c9f431aee769960e15ba8b96890466ef2457599852385c661f752ce20f9da0c09ab6b19df74e76a95967446f8d0fd415e7bee2a12a114c20eb5292ae7a349ae577820d5520a1f3fb62a17ce6a7e68fa7c79111d8860920bc048ef43fe84486ccb87c25f0ae045f0cce1e7989a9aa220a28bdd4827e751a24a6d5c62d790a66393b93111c1a55dd7421a10184974c7c5"`,
			'hex',
		);

		expect(sodium.crypto_stream_xchacha20_xor(plaintext, iv, key)).toStrictEqual(
			new Uint8Array(expectedCt),
		);
	});

	describe('XChaCha20-Poly1305 AEAD', () => {
		const plaintext = Buffer.from(
			`4c616469657320616e642047656e746c656d656e206f662074686520636c617373206f66202739393a204966204920636f756c64206f6666657220796f75206f6e6c79206f6e652074697020666f7220746865206675747572652c2073756e73637265656e20776f756c642062652069742e`,
			'hex',
		);

		const aad = Buffer.from('50515253c0c1c2c3c4c5c6c7', 'hex');

		const key = Buffer.from(
			`808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f`,
			'hex',
		);

		const iv = Buffer.from(`404142434445464748494a4b4c4d4e4f5051525354555657`, 'hex');

		const poly1305Key = Buffer.from(
			`7b191f80f361f099094f6f4b8fb97df847cc6873a8f2b190dd73807183f907d5`,
			'hex',
		);

		const expectedCt = Buffer.from(
			`bd6d179d3e83d43b9576579493c0e939572a1700252bfaccbed2902c21396cbb731c7f1b0b4aa6440bf3a82f4eda7e39ae64c6708c54c216cb96b72e1213b4522f8c9ba40db5d945b11b69b982c1bb9e3f3fac2bc369488f76b2383565d3fff921f9664c97637da9768812f615c68b13b52e`,
			'hex',
		);

		const tag = Buffer.from(`c0875924c1c7987947deafd8780acf49`, 'hex');

		test('Test data is correct', () => {
			expect(new Uint8Array(aad)).toStrictEqual(
				Uint8Array.from([
					0x50, 0x51, 0x52, 0x53, 0xc0, 0xc1, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6,
					0xc7,
				]),
			);

			expect(plaintext.toString('ascii')).toBe(
				`Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.`,
			);

			expect(iv.toString('ascii')).toBe(`@ABCDEFGHIJKLMNOPQRSTUVW`);
		});

		test('Poly 1305 key derivation', async () => {
			await sodium.ready;

			expect(
				sodium.crypto_stream_chacha20_xor_ic(
					new Uint8Array(32),
					new Uint8Array(iv).slice(16),
					0,
					sodium.crypto_core_hchacha20(
						new Uint8Array(iv).slice(0, 16),
						key,
						null,
					),
				),
			).toStrictEqual(new Uint8Array(poly1305Key));
		});

		test('XChaCha20-Poly1305 wrapper', async () => {
			const cipher = new XChaCha20Poly1305(key, iv);

			const encryptionResult = await cipher.encrypt(plaintext, { aad });
			expect(encryptionResult).toStrictEqual({
				ciphertext: new Uint8Array(expectedCt),
				mac: new Uint8Array(tag),
			});

			await expect(
				cipher.decrypt(encryptionResult.ciphertext, encryptionResult.mac, {
					aad,
				}),
			).resolves.toStrictEqual(new Uint8Array(plaintext));

			// Cannot decrypt with incorrect mac
			const tamperedMac = new Uint8Array(encryptionResult.mac);
			tamperedMac[0] ^= 0x01;
			await expect(
				cipher.decrypt(encryptionResult.ciphertext, tamperedMac, { aad }),
			).rejects.toThrow();
		});

		test('XChaCha20-Poly1305 detached mode', async () => {
			await sodium.ready;

			expect(
				sodium.crypto_aead_xchacha20poly1305_ietf_encrypt_detached(
					plaintext,
					aad,
					null,
					iv,
					key,
				),
			).toStrictEqual({
				ciphertext: new Uint8Array(expectedCt),
				mac: new Uint8Array(tag),
			});
		});

		test('XChaCha20-Poly1305 ciphertext', async () => {
			await sodium.ready;

			expect(
				sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
					plaintext,
					aad,
					null,
					iv,
					key,
				),
			).toStrictEqual(new Uint8Array(Buffer.concat([expectedCt, tag])));
		});
	});
});
