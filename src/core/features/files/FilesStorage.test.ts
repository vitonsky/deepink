import { webcrypto } from 'crypto';
import { createFakeRandomBytesGenerator } from '@core/encryption/__tests__/random';
import { AESCipher } from '@core/encryption/ciphers/AES';
import { EncryptionController } from '@core/encryption/EncryptionController';

import { EncryptedFS } from './EncryptedFS';
import { InMemoryFS } from './InMemoryFS';
import { RootedFS } from './RootedFS';
import { ZipFS } from './ZipFS';
import { IFilesStorage } from '.';

vi.stubGlobal('self', {
	crypto: webcrypto,
});

const systems: { name: string; init(): Promise<IFilesStorage> }[] = [
	{
		name: 'InMemoryFS',
		async init() {
			return new InMemoryFS();
		},
	},
	{
		name: 'ZipFS',
		async init() {
			return new ZipFS(new InMemoryFS());
		},
	},
	{
		name: 'RootedFS',
		async init() {
			const fs = new InMemoryFS();
			await fs.write('/secret', new ArrayBuffer(100));
			return new RootedFS(fs, '/foo');
		},
	},
	{
		name: 'EncryptedFS',
		async init() {
			const seededRandomBytes = createFakeRandomBytesGenerator(0);

			const fs = new InMemoryFS();
			return new EncryptedFS(
				fs,
				new EncryptionController(
					new AESCipher(seededRandomBytes(32), seededRandomBytes),
				),
			);
		},
	},
];

systems.map((fsInfo) =>
	describe(`Cases for ${fsInfo.name}`, () => {
		test('CRUD', async () => {
			const fs = await fsInfo.init();

			await expect(fs.list()).resolves.toEqual([]);

			const buffer1 = webcrypto.getRandomValues(
				new Uint8Array(new ArrayBuffer(300)),
			);
			await expect(fs.write('/bar', buffer1.buffer)).resolves.toBeUndefined();
			await expect(fs.list()).resolves.toEqual(['/bar']);
			await expect(fs.get('/bar')).resolves.toStrictEqual(buffer1.buffer);

			const buffer2 = webcrypto.getRandomValues(
				new Uint8Array(new ArrayBuffer(300)),
			);
			await expect(fs.write('/foo', buffer2.buffer)).resolves.toBeUndefined();
			await expect(fs.list()).resolves.toEqual(['/bar', '/foo']);
			await expect(fs.get('/foo')).resolves.toStrictEqual(buffer2.buffer);

			await expect(fs.delete(['/foo'])).resolves.toBeUndefined();
			await expect(fs.list()).resolves.toEqual(['/bar']);
		});
	}),
);
