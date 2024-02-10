import { webcrypto } from 'crypto';

import { AESGCMCipher } from './ciphers/AES';
import { TwofishCTRCipher } from './ciphers/Twofish';
import { BufferIntegrityProcessor } from './processors/BufferIntegrityProcessor';
import { BufferSizeObfuscationProcessor } from './processors/BufferSizeObfuscationProcessor';
import { PipelineProcessor } from './processors/PipelineProcessor';
import { getDerivedKeysManager, getMasterKey } from './utils/keys';

// Returns always the same output, to reproduce encryption output
// Implementation generates a long sequence with no repeats, for transparent fingerprint analyzing
const getRandomBytesMock = (length = 16) =>
	new Uint8Array(length).map((_, idx) => idx + Math.max(0, idx + (idx % 255)));

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
		new BufferSizeObfuscationProcessor(getRandomBytesMock),
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
