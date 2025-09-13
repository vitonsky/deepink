import { ENCRYPTION_ALGORITHM } from '.';

export const formatAlgorithmsToString = (algorithms: ENCRYPTION_ALGORITHM[]) => {
	return algorithms.join('-');
};

export const parseAlgorithms = (algorithms: string): ENCRYPTION_ALGORITHM[] => {
	const validAlgorithms = Object.values(ENCRYPTION_ALGORITHM);
	return algorithms.split('-').map((name) => {
		const algorithm = validAlgorithms.find((alg) => alg === name);
		if (!algorithm) {
			throw new Error(
				`Unsupported encryption algorithm: "${name}". Supported: ${validAlgorithms.join(
					', ',
				)}`,
			);
		}
		return algorithm;
	});
};
