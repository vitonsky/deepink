import {
	enableAutoOutboundTracking,
	enableAutoPageviews,
	filters,
	Plausible,
	skipByFlag,
	transformers,
	userId,
} from 'plausible-client';

import { enableEngagementTracking } from './enableEngagementTracking';

export const createPlausibleInstance = () => {
	const plausible = new Plausible({
		apiHost: 'https://uxt.vitonsky.net',
		domain: 'deepink.io',
		filter: (event, eventName) => {
			if (typeof window === 'undefined') return false;

			return filters(
				skipByFlag('developer'),
				// skipForHosts(['localhost']),
			)(event, eventName);
		},
		transform: (event, eventName) => {
			if (typeof window === 'undefined') return event;

			return transformers([
				userId(),
				(event) => {
					event.props = {
						...event.props,
						language: navigator.language,
						languages: navigator.languages.join(','),
					};
					return event;
				},
			])(event, eventName);
		},
	});

	const cleanups: ((() => void) | undefined)[] = [];

	if (typeof window !== 'undefined') {
		cleanups.push(enableAutoOutboundTracking(plausible));
		cleanups.push(enableAutoPageviews(plausible));
		cleanups.push(enableEngagementTracking(plausible));
	}

	return {
		plausible,
		cleanup: () => {
			cleanups.forEach((stop) => stop?.());
		},
	};
};

export enum ANALYTICS_EVENT {
	DOWNLOAD = 'download',
}

export type ANALYTICS_EVENT_PAYLOADS = {
	[ANALYTICS_EVENT.DOWNLOAD]: {
		context: string;
		fileName?: string;
	};
};
