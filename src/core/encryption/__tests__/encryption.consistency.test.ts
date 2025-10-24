import crc32 from 'crc/calculators/crc32';
import { webcrypto } from 'crypto';

import { AESGCMCipher } from '../ciphers/AES';
import { TwofishCTRCipher } from '../ciphers/Twofish';
import { BufferIntegrityProcessor } from '../processors/BufferIntegrityProcessor';
import { BufferSizeObfuscationProcessor } from '../processors/BufferSizeObfuscationProcessor';
import { PipelineProcessor } from '../processors/PipelineProcessor';
import { getDerivedKeysManager, getMasterKey } from '../utils/keys';

// Returns always the same output, to reproduce encryption output
// Implementation generates a long sequence with no repeats, for transparent fingerprint analyzing
const getRandomBytesMock = (length = 16) =>
	new Uint8Array(length).map(
		(_, idx) => idx + Math.max(0, idx + ((length + idx) % 255)),
	).buffer;

const getKeys = async (parameters: { password: string; salt: string }) => {
	const password = new TextEncoder().encode(parameters.password);
	const salt = new TextEncoder().encode(parameters.salt);

	const derivedKeys = await getMasterKey(password.buffer, salt.buffer).then(
		(masterKey) => getDerivedKeysManager(masterKey, salt),
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

test('composed processors returns idempotent result', async () => {
	const keys = await getKeys({
		password: 'SuperSecretPassword',
		salt: 'salt bytes',
	});

	const cipher = new PipelineProcessor([
		new BufferIntegrityProcessor(),
		new BufferSizeObfuscationProcessor(getRandomBytesMock),
		new TwofishCTRCipher(keys.twofish, getRandomBytesMock),
		new AESGCMCipher(keys.aes, getRandomBytesMock),
	]);

	const textSample = 'Hello world! This is encryption example text';
	const encryptedBytes = await cipher.encrypt(
		new TextEncoder().encode(textSample).buffer,
	);
	expect(crc32(new Uint8Array(encryptedBytes))).toMatchSnapshot();

	const decryptedBytes = await cipher.decrypt(encryptedBytes);
	expect(new TextDecoder().decode(decryptedBytes)).toBe(textSample);

	// Encryption for the same text input must be equal, because mocked random generator generates identical sequences
	const encryptedBytes2 = await cipher.encrypt(
		new TextEncoder().encode(textSample).buffer,
	);
	expect(new Uint32Array(encryptedBytes)).toStrictEqual(
		new Uint32Array(encryptedBytes2),
	);

	// Encryption for 2 different texts must not be equal
	const encryptedBytes3 = await cipher.encrypt(
		new TextEncoder().encode('Another text').buffer,
	);
	expect(new Uint32Array(encryptedBytes)).not.toEqual(new Uint32Array(encryptedBytes3));

	// Random bytes decryption must throw exception, because integrity check error
	const randomBytes = getRandomBytesMock(800);
	await expect(cipher.decrypt(randomBytes)).rejects.toThrow();
});
