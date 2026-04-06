import { CryptographyUtils } from './CryptographyUtils';

test('Derive bits and erase a key via null bytes overriding', async () => {
	const utils = new CryptographyUtils();
	onTestFinished(() => utils.dispose());

	const key = new Uint8Array(100).fill(0xff);
	expect(key).toEqual(new Uint8Array(100).fill(0xff));

	await expect(
		utils.deriveBits(key, new Uint8Array(16), 32),
	).resolves.toMatchSnapshot();

	expect(key).toEqual(new Uint8Array(100).fill(0));
});

test('Errors must be thrown after dispose', async () => {
	const utils = new CryptographyUtils();

	await utils.dispose();
	await expect(
		utils.deriveBits(new Uint8Array(100), new Uint8Array(16), 32),
	).rejects.toThrow();
});
