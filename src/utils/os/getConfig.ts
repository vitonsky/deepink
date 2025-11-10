import ms from 'ms';
import { z } from 'zod';
import { isDevMode } from '@electron/utils/app';

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
			enabled: FLAG_SCHEME.parse(process.env.TELEMETRY) ?? !isDevMode(),
			verbose: FLAG_SCHEME.parse(process.env.TELEMETRY_DEBUG) ?? isDevMode(),
			syncInterval: z
				.string()
				.optional()
				.default('1h')
				.transform((time) => ms(time))
				.parse(process.env.TELEMETRY_SYNC_INTERVAL),
			api: {
				baseURL: z
					.string()
					.optional()
					.default('https://uxt.vitonsky.net')
					.parse(process.env.TELEMETRY_URL),
				appName: z
					.string()
					.optional()
					.default('deepink')
					.parse(process.env.TELEMETRY_APP_NAME),
			},
		},
	};
};
