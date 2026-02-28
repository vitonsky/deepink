import { initReactI18next } from 'react-i18next';
import { createInstance, type ResourceKey } from 'i18next';

import type { SupportedLanguage } from '.';

export function createI18nInstance(
	lang: SupportedLanguage,
	// Translations for a single language, keyed by namespace
	resources: Record<string, ResourceKey>,
) {
	const instance = createInstance();

	instance.use(initReactI18next).init({
		// https://www.locize.com/docs/general-questions/why-am-i-seeing-a-support-notice-for-i18next/
		showSupportNotice: false,
		lng: lang,
		fallbackLng: 'en',
		resources: {
			// Shape expected by i18next: { [lang]: { [ns]: translations } }
			[lang]: resources,
		},
		interpolation: { escapeValue: false },
	});

	return instance;
}
