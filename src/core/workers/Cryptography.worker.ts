import { BufferSizeObfuscator } from '../encryption/BufferSizeObfuscator';
import { AESCipher } from '../encryption/ciphers/AES';
import { CascadeCipher } from '../encryption/ciphers/CascadeCipher';
import { Twofish } from '../encryption/ciphers/Twofish';
import { EncryptionController } from '../encryption/EncryptionController';
import { EncryptionIntegrityCheck } from '../encryption/EncryptionIntegrityCheck';
import { WorkerMessenger, WorkerRequests } from './utils';

console.log('Hello world from worker');

let encryptionController: EncryptionController | null = null;
const messenger = new WorkerMessenger(self);
const requests = new WorkerRequests(messenger);

const workerId = performance.now();
requests.addHandler('init', async ({ secretKey, salt }) => {
	self.setInterval(() => console.log('Worker pulse', workerId), 1000);

	await new Promise((res) => setTimeout(res, 8000));

	console.log('Loaded');

	encryptionController = new EncryptionController(
		new EncryptionIntegrityCheck(
			new BufferSizeObfuscator(
				new CascadeCipher([
					new AESCipher('secretKey', salt),
					new Twofish(secretKey),
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
