import { IEncryptionProcessor } from '@core/encryption';
import { AESGCMCipher } from '@core/encryption/ciphers/AES';
import { TwofishCTRCipher } from '@core/encryption/ciphers/Twofish';
import { WorkerMessenger } from '@utils/workers/WorkerMessenger';
import { WorkerRPC } from '@utils/workers/WorkerRPC';

import { EncryptionController } from '../../../encryption/EncryptionController';
import { BufferIntegrityProcessor } from '../../../encryption/processors/BufferIntegrityProcessor';
import { BufferSizeObfuscationProcessor } from '../../../encryption/processors/BufferSizeObfuscationProcessor';
import { PipelineProcessor } from '../../../encryption/processors/PipelineProcessor';
import { getDerivedKeysManager, getMasterKey } from '../../../encryption/utils/keys';
import { getRandomBytes } from '../../../encryption/utils/random';

import { ENCRYPTION_ALGORITHM } from '../algorithms';
import { parseAlgorithmList } from '../utils';
import { FakeWorkerObject } from '.';

export default FakeWorkerObject;

console.log('Hello world from worker');

let encryptionController: EncryptionController | null = null;
const messenger = new WorkerMessenger(self);
const requests = new WorkerRPC(messenger);

const workerId = performance.now();
requests.addHandler('init', async ({ key, salt, algorithm }) => {
	self.setInterval(() => console.log('Worker pulse', workerId), 1000);

	// Convert `ArrayBuffer`
	if (salt instanceof ArrayBuffer) {
		salt = new Uint8Array(salt);
	}

	if (!(salt instanceof Uint8Array))
		throw new Error('Salt is not instance of Uint8Array');

	const derivedKeys = await getMasterKey(key, salt).then((masterKey) =>
		getDerivedKeysManager(masterKey, salt),
	);

	const cipherMap: Record<ENCRYPTION_ALGORITHM, () => Promise<IEncryptionProcessor>> = {
		[ENCRYPTION_ALGORITHM.AES]: async () => {
			const key = await derivedKeys.getDerivedKey('aes-gcm-cipher', {
				name: 'AES-GCM',
				length: 256,
			});
			return new AESGCMCipher(key, getRandomBytes);
		},
		[ENCRYPTION_ALGORITHM.TWOFISH]: async () => {
			const key = await derivedKeys.getDerivedBytes('twofish-ctr-cipher', 256);
			return new TwofishCTRCipher(new Uint8Array(key), getRandomBytes);
		},
	};

	const algorithmList = parseAlgorithmList(algorithm);
	const ciphers = await Promise.all(algorithmList.map((name) => cipherMap[name]()));

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
