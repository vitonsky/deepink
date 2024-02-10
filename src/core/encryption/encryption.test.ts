import { webcrypto } from 'crypto';

import { AESGCMCipher } from './ciphers/AES';
import { TwofishCTRCipher } from './ciphers/Twofish';
import { BufferIntegrityProcessor } from './processors/BufferIntegrityProcessor';
import { PipelineProcessor } from './processors/PipelineProcessor';
import { getDerivedKeysManager, getMasterKey } from './utils/keys';

// Return always the same data, to reproduce encryption output
const getRandomBytesMock = (length: number = 16) => new Uint8Array(length).buffer;

const password = new TextEncoder().encode('SuperSecretPassword');
const salt = new TextEncoder().encode('salt bytes');

const getKeys = async () => {
	const derivedKeys = await getMasterKey(password, salt).then((masterKey) =>
		getDerivedKeysManager(masterKey, salt),
	);

	const aes = await derivedKeys.getDerivedKey('aes-gcm-cipher', {
		name: 'AES-GCM',
		length: 256,
	});

	const twofish = await derivedKeys
		.getDerivedBytes('twofish-ctr-cipher', 256)
		.then((buffer) => new Uint8Array(buffer));

	return { aes, twofish };
};

// Mock for `crypto` for jest context
beforeEach(() => {
	Object.defineProperties(global, {
		crypto: { value: webcrypto, writable: true },
		self: { value: global, writable: false },
	});
});

test('composed processors returns persistent result', async () => {
	const keys = await getKeys();

	const cipher = new PipelineProcessor([
		new BufferIntegrityProcessor(),
		new TwofishCTRCipher(keys.twofish, getRandomBytesMock),
		new AESGCMCipher(keys.aes, getRandomBytesMock),
	]);

	const textSample = 'Hello world! This is encryption example text';
	const encryptedBytes = await cipher.encrypt(new TextEncoder().encode(textSample));
	expect(new TextDecoder().decode(encryptedBytes)).toMatchSnapshot();

	const decryptedBytes = await cipher.decrypt(encryptedBytes);
	expect(new TextDecoder().decode(decryptedBytes)).toMatchSnapshot();

	expect(new TextDecoder().decode(decryptedBytes)).toBe(textSample);
});
