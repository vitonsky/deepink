import { WorkerMessenger } from '@utils/workers/WorkerMessenger';
import { WorkerRPC } from '@utils/workers/WorkerRPC';

import { AESGCMCipher } from '../encryption/ciphers/AES';
import { TwofishCTRCipher } from '../encryption/ciphers/Twofish';
import { EncryptionController } from '../encryption/EncryptionController';
import { BufferIntegrityProcessor } from '../encryption/processors/BufferIntegrityProcessor';
import { BufferSizeObfuscationProcessor } from '../encryption/processors/BufferSizeObfuscationProcessor';
import { PipelineProcessor } from '../encryption/processors/PipelineProcessor';
import { getDerivedKeysManager, getMasterKey } from '../encryption/utils/keys';
import { getRandomBytes } from '../encryption/utils/random';

console.log('Hello world from worker');

let encryptionController: EncryptionController | null = null;
const messenger = new WorkerMessenger(self);
const requests = new WorkerRPC(messenger);

const workerId = performance.now();
requests.addHandler('init', async ({ secretKey, salt }) => {
	self.setInterval(() => console.log('Worker pulse', workerId), 1000);

	if (!(salt instanceof Uint8Array))
		throw new Error('Salt is not instance of Uint8Array');

	const derivedKeys = await getMasterKey(secretKey, salt).then((masterKey) =>
		getDerivedKeysManager(masterKey, salt),
	);

	const aesKey = await derivedKeys.getDerivedKey('aes-gcm-cipher', {
		name: 'AES-GCM',
		length: 256,
	});
	const twofishKey = await derivedKeys
		.getDerivedBytes('twofish-ctr-cipher', 256)
		.then((buffer) => new Uint8Array(buffer));

	encryptionController = new EncryptionController(
		new PipelineProcessor([
			new BufferIntegrityProcessor(),
			new BufferSizeObfuscationProcessor(getRandomBytes),
			new AESGCMCipher(aesKey, getRandomBytes),
			new TwofishCTRCipher(twofishKey, getRandomBytes),
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
