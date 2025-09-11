export enum ENCRYPTION_ALGORITHM {
	AES = 'AES',
	TWOFISH = 'Twofish',
	AES_TWOFISH = 'AES-Twofish',
	TWOFISH_AES = 'Twofish-AES',
}

// algorithm names displayed to the user
export const ENCRYPTION_ALGORITHM_NAMES = {
	[ENCRYPTION_ALGORITHM.AES]: 'AES',
	[ENCRYPTION_ALGORITHM.TWOFISH]: 'Twofish',
	[ENCRYPTION_ALGORITHM.AES_TWOFISH]: 'AES -> Twofish',
	[ENCRYPTION_ALGORITHM.TWOFISH_AES]: 'Twofish -> AES',
};
