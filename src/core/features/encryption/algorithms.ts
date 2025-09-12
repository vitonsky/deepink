export enum ENCRYPTION_ALGORITHM {
	AES = 'AES',
	TWOFISH = 'Twofish',
}

export const buildAlgorithmString = (algorithms: ENCRYPTION_ALGORITHM[]) => {
	return algorithms.join('-');
};

export const ENCRYPTION_ALGORITHM_LIST = [
	ENCRYPTION_ALGORITHM.AES,
	ENCRYPTION_ALGORITHM.TWOFISH,
	buildAlgorithmString([ENCRYPTION_ALGORITHM.AES, ENCRYPTION_ALGORITHM.TWOFISH]),
	buildAlgorithmString([ENCRYPTION_ALGORITHM.TWOFISH, ENCRYPTION_ALGORITHM.AES]),
];
