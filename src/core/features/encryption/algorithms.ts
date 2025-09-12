export enum ENCRYPTION_ALGORITHM {
	AES = 'AES',
	TWOFISH = 'Twofish',
}

export const buildAlgorithmSequence = (algorithms: ENCRYPTION_ALGORITHM[]) => {
	return algorithms.join('-');
};

export const ENCRYPTION_ALGORITHMS_LIST = [
	ENCRYPTION_ALGORITHM.AES,
	ENCRYPTION_ALGORITHM.TWOFISH,
	buildAlgorithmSequence([ENCRYPTION_ALGORITHM.AES, ENCRYPTION_ALGORITHM.TWOFISH]),
	buildAlgorithmSequence([ENCRYPTION_ALGORITHM.TWOFISH, ENCRYPTION_ALGORITHM.AES]),
];
