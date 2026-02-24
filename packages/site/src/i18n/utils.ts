import fs from 'node:fs';
import path from 'node:path';

import type { ResourceKey } from 'i18next';

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from './config';
import type { i18nPageContext } from './types';

export function isValidLanguage(lang: string): lang is SupportedLanguage {
	return SUPPORTED_LANGUAGES.includes(lang);
}

/**
 * Returns localized path, e.g. getLocalizedPath("de", "/about") => "/de/about"
 */
export function getLocalizedPath(lang: SupportedLanguage, path = '/') {
	const cleanPath = path.startsWith('/') ? path : `/${path}`;
	if (lang === DEFAULT_LANGUAGE) return cleanPath;
	return `/${lang}${cleanPath === '/' ? '' : cleanPath}`;
}

/**
 * Generate static paths for all supported languages
 */
export function getStaticLangPaths() {
	return SUPPORTED_LANGUAGES.map((lang) => ({ params: { lang } }));
}

export function loadTranslations(
	lang: SupportedLanguage,
	namespaces: string[] = [],
): Record<string, ResourceKey> {
	return Object.fromEntries(
		namespaces.map((ns) => {
			const filePath = path.resolve(`src/i18n/locales/${lang}/${ns}.json`);
			const raw = fs.readFileSync(filePath, 'utf-8');
			return [ns, JSON.parse(raw)];
		}),
	);
}

export function i18nGetContext({
	language,
	namespaces,
	path,
}: {
	language: SupportedLanguage;
	namespaces: string[];
	path?: string;
}): i18nPageContext {
	const currentLanguage = isValidLanguage(language) ? language : DEFAULT_LANGUAGE;

	const commonNamespaces = ['layout'];
	const resources = loadTranslations(currentLanguage, [
		...commonNamespaces,
		...namespaces,
	]);

	return {
		language: currentLanguage,
		resources,
		altVersions: !path
			? []
			: SUPPORTED_LANGUAGES.values()
					.filter((lang) => lang !== currentLanguage)
					.map((lang) => {
						const segments = path.split('/');
						segments[1] = lang; // swap language only

						return { langCode: lang, url: segments.join('/') };
					})
					.toArray(),
	};
}
