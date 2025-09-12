import { ENCRYPTION_ALGORITHM, ENCRYPTION_ALGORITHM_LIST } from './algorithms';

export const joinAlgorithms = (algorithms: ENCRYPTION_ALGORITHM[]) => {
	return algorithms.join('-');
};

export function isValidAlgorithm(algorithm: string): algorithm is ENCRYPTION_ALGORITHM {
	return Object.values(ENCRYPTION_ALGORITHM).includes(
		algorithm as ENCRYPTION_ALGORITHM,
	);
}

export function parseAlgorithms(algorithms: string) {
	return algorithms.split('-').map((name) => {
		if (!isValidAlgorithm(name)) {
			throw new Error(
				`Unsupported encryption algorithm: ${algorithms}. Supported: ${ENCRYPTION_ALGORITHM_LIST.join(
					', ',
				)}`,
			);
		}
		return name;
	});
}
