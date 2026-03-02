import { createContext, useCallback, useContext } from 'react';
import type { Plausible } from 'plausible-client';

import { type ANALYTICS_EVENT, type ANALYTICS_EVENT_PAYLOADS } from '.';

export const PlausibleContext = createContext<Plausible | null>(null);

export const useAnalytics = () => {
	const plausible = useContext(PlausibleContext);
	if (!plausible) throw new Error('Plausible context is not provided');

	const track = useCallback(
		<T extends ANALYTICS_EVENT>(
			eventName: T,
			...rest: T extends keyof ANALYTICS_EVENT_PAYLOADS
				? [ANALYTICS_EVENT_PAYLOADS[T]]
				: [Record<string, string | number | null | undefined>] | []
		) => {
			const [props = {}] = rest;
			plausible.trackEvent(eventName, { props });
		},
		[plausible],
	);

	const callback =
		<T extends ANALYTICS_EVENT>(...args: Parameters<typeof track<T>>) =>
		() => {
			track(...args);
		};

	return { track, callback };
};
