import { IEncryptionController } from '@core/encryption';

export type EncryptionConfig = {
	// TODO: make API stronger, accept only `ArrayBuffer`
	// and rewrite its content after a key derivation
	key: string | ArrayBuffer;
	salt: ArrayBuffer;
	algorithm: string;
};

export type EncryptionWorkerConfig = EncryptionConfig & { disablePulse?: boolean };
export interface EncryptionWorker extends IEncryptionController {
	init(config: EncryptionWorkerConfig): Promise<void>;
}
