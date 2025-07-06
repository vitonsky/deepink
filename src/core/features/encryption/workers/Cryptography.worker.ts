import { WorkerMessenger } from '@utils/workers/WorkerMessenger';
import { WorkerRPC } from '@utils/workers/WorkerRPC';

import { AESGCMCipher } from '../../../encryption/ciphers/AES';
import { TwofishCTRCipher } from '../../../encryption/ciphers/Twofish';
import { EncryptionController } from '../../../encryption/EncryptionController';
import { BufferIntegrityProcessor } from '../../../encryption/processors/BufferIntegrityProcessor';
import { BufferSizeObfuscationProcessor } from '../../../encryption/processors/BufferSizeObfuscationProcessor';
import { PipelineProcessor } from '../../../encryption/processors/PipelineProcessor';
import { getDerivedKeysManager, getMasterKey } from '../../../encryption/utils/keys';
import { getRandomBytes } from '../../../encryption/utils/random';

import { ENCRYPTION_ALGORITHM } from '../EncryptionAlgorithm';
import { FakeWorkerObject } from '.';

export default FakeWorkerObject;

console.log('Hello world from worker');

let encryptionController: EncryptionController | null = null;
const messenger = new WorkerMessenger(self);
const requests = new WorkerRPC(messenger);

const workerId = performance.now();
requests.addHandler('init', async ({ secretKey, salt, algorithm }) => {
	self.setInterval(() => console.log('Worker pulse', workerId), 1000);

	// Convert `ArrayBuffer`
	if (salt instanceof ArrayBuffer) {
		salt = new Uint8Array(salt);
	}

	if (!(salt instanceof Uint8Array))
		throw new Error('Salt is not instance of Uint8Array');

	const derivedKeys = await getMasterKey(secretKey, salt).then((masterKey) =>
		getDerivedKeysManager(masterKey, salt),
	);

	const getAESCipher = async () => {
		const key = await derivedKeys.getDerivedKey('aes-gcm-cipher', {
			name: 'AES-GCM',
			length: 256,
		});
		return new AESGCMCipher(key, getRandomBytes);
	};
	const getTwofishCipher = async () => {
		const key = await derivedKeys
			.getDerivedBytes('twofish-ctr-cipher', 256)
			.then((buffer) => new Uint8Array(buffer));
		return new TwofishCTRCipher(key, getRandomBytes);
	};

	const ciphers = [];

	switch (algorithm) {
		case ENCRYPTION_ALGORITHM.AES:
			ciphers.push(await getAESCipher());
			break;
		case ENCRYPTION_ALGORITHM.TWOFISH:
			ciphers.push(await getTwofishCipher());
			break;
		case ENCRYPTION_ALGORITHM.AES_TWOFISH:
			ciphers.push(await getAESCipher(), await getTwofishCipher());
			break;
		case ENCRYPTION_ALGORITHM.TWOFISH_AES:
			ciphers.push(await getTwofishCipher(), await getAESCipher());
			break;
		default:
			throw new Error('The encryption algorithm was expected but not received');
	}

	encryptionController = new EncryptionController(
		new PipelineProcessor([
			new BufferIntegrityProcessor(),
			new BufferSizeObfuscationProcessor(getRandomBytes),
			...ciphers,
		]),
	);
});

requests.addHandler('encrypt', async (buffer, respond) => {
	if (!encryptionController) return;

	const result = await encryptionController.encrypt(buffer);
	respond(result, [result]);
});

requests.addHandler('decrypt', async (buffer, respond) => {
	if (!encryptionController) return;

	const result = await encryptionController.decrypt(buffer);
	respond(result, [result]);
});
