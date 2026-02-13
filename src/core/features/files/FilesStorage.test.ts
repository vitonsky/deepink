import { fillBufferWithRandomBytes } from '@core/encryption/utils/random';
import { IFilesStorage } from '.';
import { InMemoryFS } from './InMemoryFS';
import { ZipFS } from './ZipFS';
import { webcrypto } from 'crypto';
import { OverlayFS } from './OverlayFS';
import { RootedFS } from './RootedFS';
import { EncryptedFS } from './EncryptedFS';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { getDerivedKeysManager, getMasterKey } from '@core/encryption/utils/keys';
import { AESGCMCipher } from '@core/encryption/ciphers/AES';

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
			const derivedKeys = await getMasterKey(
				webcrypto.getRandomValues(new Uint8Array(new ArrayBuffer(300))).buffer,
				webcrypto.getRandomValues(new Uint8Array(new ArrayBuffer(300))).buffer,
			).then((masterKey) =>
				getDerivedKeysManager(
					masterKey,
					webcrypto.getRandomValues(new Uint8Array(new ArrayBuffer(300))),
				),
			);

			const aes = await derivedKeys.getDerivedKey('aes-gcm-cipher', {
				name: 'AES-GCM',
				length: 256,
			});

			const getRandomBytesMock = (length = 16) =>
				new Uint8Array(length).map(
					(_, idx) => idx + Math.max(0, idx + ((length + idx) % 255)),
				).buffer;

			const fs = new InMemoryFS();
			return new EncryptedFS(
				fs,
				new EncryptionController(new AESGCMCipher(aes, getRandomBytesMock)),
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
