import { BufferSizeObfuscator } from '../encryption/BufferSizeObfuscator';
import { AESCipher } from '../encryption/ciphers/AES';
import { CascadeCipher } from '../encryption/ciphers/CascadeCipher';
import { Twofish } from '../encryption/ciphers/Twofish';
import { EncryptionController } from '../encryption/EncryptionController';
import { EncryptionIntegrityCheck } from '../encryption/EncryptionIntegrityCheck';
import { WorkerMessenger } from './utils';

console.log('Hello world from worker');

let cryptor: EncryptionController | null = null;
const messanger = new WorkerMessenger(self);
messanger.onMessage((data, response) => {
	if (typeof data !== 'object' || (data as any).method !== 'init') return;

	const { secretKey, salt } = data as any;

	cryptor = new EncryptionController(
		new EncryptionIntegrityCheck(
			new BufferSizeObfuscator(
				new CascadeCipher([
					new AESCipher('secretKey', salt),
					new Twofish(secretKey),
				]),
			),
		),
	);

	response(true);
});

messanger.onMessage(async (data, response) => {
	if (typeof data !== 'object' || (data as any).method !== 'encrypt') return;
	if (!cryptor) return;

	const result = await cryptor.encrypt(data.buffer);
	// console.log('Respond e', result);
	response(result, [result]);
});

messanger.onMessage(async (data, response) => {
	if (typeof data !== 'object' || (data as any).method !== 'decrypt') return;
	if (!cryptor) return;

	const result = await cryptor.decrypt(data.buffer);
	// console.log('Respond d', result);
	response(result, [result]);
});
