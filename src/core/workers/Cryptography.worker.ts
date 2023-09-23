import { WorkerMessenger } from '../../utils/workers/WorkerMessenger';
import { WorkerRPC } from '../../utils/workers/WorkerRPC';

import { BufferSizeObfuscator } from '../encryption/BufferSizeObfuscator';
import { AESGCMCipher, getDerivedKey } from '../encryption/ciphers/AES';
import { CascadeCipher } from '../encryption/ciphers/CascadeCipher';
import { TwofishCTRCipher } from '../encryption/ciphers/Twofish';
import { EncryptionController } from '../encryption/EncryptionController';
import { EncryptionIntegrityCheck } from '../encryption/EncryptionIntegrityCheck';

console.log('Hello world from worker');

let encryptionController: EncryptionController | null = null;
const messenger = new WorkerMessenger(self);
const requests = new WorkerRPC(messenger);

const workerId = performance.now();
requests.addHandler('init', async ({ secretKey, salt }) => {
	self.setInterval(() => console.log('Worker pulse', workerId), 1000);

	const aesKey = await getDerivedKey('secretKey', salt);
	const twofishKey = new TextEncoder().encode(secretKey);

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
