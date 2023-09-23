import { WorkerMessenger } from '../../utils/workers/WorkerMessenger';
import { WorkerRPC } from '../../utils/workers/WorkerRPC';

import { BufferSizeObfuscator } from '../encryption/BufferSizeObfuscator';
import { AESGCMCipher } from '../encryption/ciphers/AES';
import { CascadeCipher } from '../encryption/ciphers/CascadeCipher';
import { TwofishCTRCipher } from '../encryption/ciphers/Twofish';
import { EncryptionController } from '../encryption/EncryptionController';
import { EncryptionIntegrityCheck } from '../encryption/EncryptionIntegrityCheck';
import { getDerivedKeysManager, getMasterKey } from '../encryption/utils/keys';

console.log('Hello world from worker');

let encryptionController: EncryptionController | null = null;
const messenger = new WorkerMessenger(self);
const requests = new WorkerRPC(messenger);

const workerId = performance.now();
requests.addHandler('init', async ({ secretKey, salt }) => {
	self.setInterval(() => console.log('Worker pulse', workerId), 1000);

	const derivedKeys = await getMasterKey(secretKey).then((masterKey) =>
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
		new EncryptionIntegrityCheck(
			new BufferSizeObfuscator(
				new CascadeCipher([
					new AESGCMCipher(aesKey),
					new TwofishCTRCipher(twofishKey),
				]),
			),
		),
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
