import { SerpentCipher } from '.';

const { encryptChunk } = vi.hoisted(() => ({
	encryptChunk: vi.fn((chunk: Uint8Array) => chunk),
}));

vi.mock('leviathan-crypto', () => ({
	init: async () => undefined,
	SerpentCtr: class {
		beginEncrypt() {}
		beginDecrypt() {}
		encryptChunk = encryptChunk;
		dispose() {}
	},
}));

test('pads the last Serpent chunk to 16-byte alignment before encryptChunk', async () => {
	const key = new Uint8Array(32);
	const iv = new Uint8Array(16);
	const cipher = new SerpentCipher(key, () => iv);

	await cipher.encrypt(new Uint8Array(17).buffer);

	expect(encryptChunk).toHaveBeenCalledWith(
		expect.objectContaining({ byteLength: 32 }),
	);
});
