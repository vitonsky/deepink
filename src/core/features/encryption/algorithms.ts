export const ENCRYPTION_ALGORITHM = {
	AES: 'aes',
	TWOFISH: 'twofish',
	AES_TWOFISH: 'aes-twofish',
	TWOFISH_AES: 'twofish-aes',
} as const;

type EncryptionAlgorithmMap = typeof ENCRYPTION_ALGORITHM;
export type EncryptionAlgorithm = EncryptionAlgorithmMap[keyof EncryptionAlgorithmMap];
