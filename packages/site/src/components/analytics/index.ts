import {
	enableAutoOutboundTracking,
	enableAutoPageviews,
	filters,
	Plausible,
	skipForHosts,
	transformers,
	userId,
} from 'plausible-client';

import { enableClickTracking } from './enableClickTracking';
import { enableEngagementTracking } from './enableEngagementTracking';
import { enableSessionScoring } from './enableSessionScoring';

const getSessionId = () => {
	try {
		return crypto.randomUUID();
	} catch {
		return 'fallback-' + String(Math.round(Math.random() * 10000000000));
	}
};

export const createPlausibleInstance = () => {
	const plausible = new Plausible({
		apiHost: 'https://uxt.vitonsky.net',
		domain: 'deepink.io',
		filter: (event, eventName) => {
			if (typeof window === 'undefined') return false;

			return filters(skipForHosts(['localhost']))(event, eventName);
		},
		transform: (event, eventName) => {
			if (typeof window === 'undefined') return event;

			return transformers([
				userId(),
				(event) => {
					let sessionId = sessionStorage.getItem('sessionId');
					if (!sessionId) {
						sessionId = getSessionId();
						sessionStorage.setItem('sessionId', sessionId);
					}

					event.props = {
						...event.props,
						sessionId,
					};
					return event;
				},
			])(event, eventName);
		},
	});

	const cleanups: ((() => void) | void)[] = [];

	if (typeof window !== 'undefined') {
		cleanups.push(enableAutoPageviews(plausible));
		cleanups.push(enableAutoOutboundTracking(plausible));
		cleanups.push(enableClickTracking(plausible));
		cleanups.push(enableEngagementTracking(plausible));
		cleanups.push(enableSessionScoring(plausible));
	}

	return {
		plausible,
		cleanup: () => {
			cleanups.forEach((stop) => stop?.());
		},
	};
};

export enum ANALYTICS_EVENT {
	DOWNLOAD_BUTTON_CLICK = 'Download button click',
	LANGUAGE_VERSION_CLICK = 'Language version click',
	PAGE_404 = '404',
	SHARE_LINK = 'Share link click',
	MOBILE_MENU = 'Mobile menu click',
	FEATURES_CLICK = 'Features button click',
}

export type ANALYTICS_EVENT_PAYLOADS = {
	[ANALYTICS_EVENT.DOWNLOAD_BUTTON_CLICK]: {
		context: string;
		fileName?: string;
	};
	[ANALYTICS_EVENT.LANGUAGE_VERSION_CLICK]: {
		languageCode: string;
	};
	[ANALYTICS_EVENT.SHARE_LINK]: {
		method: string;
	};
	[ANALYTICS_EVENT.MOBILE_MENU]: {
		state: 'opened' | 'closed';
	};
};
