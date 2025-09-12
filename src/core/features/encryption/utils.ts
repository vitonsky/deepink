import { AVAILABLE_ENCRYPTION_ALGORITHMS, ENCRYPTION_ALGORITHM } from './algorithms';

export const joinAlgorithmList = (algorithms: ENCRYPTION_ALGORITHM[]) => {
	return algorithms.join('-');
};

export const isValidAlgorithm = (
	algorithm: string,
): algorithm is ENCRYPTION_ALGORITHM => {
	return Object.values(ENCRYPTION_ALGORITHM).includes(
		algorithm as ENCRYPTION_ALGORITHM,
	);
};

export const parseAlgorithmList = (algorithms: string) => {
	return algorithms.split('-').map((name) => {
		if (!isValidAlgorithm(name)) {
			throw new Error(
				`Unsupported encryption algorithm: ${algorithms}. Supported: ${AVAILABLE_ENCRYPTION_ALGORITHMS.join(
					', ',
				)}`,
			);
		}
		return name;
	});
};
