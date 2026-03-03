import { createContext, useCallback, useContext } from 'react';

import { DEFAULT_LANGUAGE } from '../i18n';

export const LocaleContext = createContext<string | null>(null);

export const useLocalePath = () => {
	const locale = useContext(LocaleContext);

	return useCallback(
		(url: string) => {
			if (!url.startsWith('/') && !url.startsWith('#')) return url;
			if (locale === null || locale === DEFAULT_LANGUAGE) return url;

			return `/${locale}${url}`;
		},
		[locale],
	);
};
