import { z } from 'zod';

/**
 * Get app config including environment variables
 */
export const getConfig = () => {
	const FLAG_SCHEME = z
		.union([z.literal('on'), z.literal('off')])
		.transform((value) => value === 'on')
		.optional();

	return {
		telemetry: {
			enabled: FLAG_SCHEME.parse(process.env.TELEMETRY),
			verbose: FLAG_SCHEME.parse(process.env.TELEMETRY_DEBUG),
		},
	};
};
