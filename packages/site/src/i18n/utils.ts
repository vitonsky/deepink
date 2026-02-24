import fs from 'node:fs';
import path from 'node:path';

import type { ResourceKey } from 'i18next';

import type { i18nPageContext } from './types';
import { DEFAULT_LANGUAGE, type SupportedLanguage } from '.';

// TODO: translate to all languages
// [
// 	'bg',
// 	'ca',
// 	'cs',
// 	'da',
// 	'de',
// 	'es',
// 	'fr',
// 	'hu',
// 	'it',
// 	'ja',
// 	'ko',
// 	'nb',
// 	'pl',
// 	'pt-br',
// 	'pt-pt',
// 	'ru',
// 	'sl',
// 	'sv',
// 	'tr',
// 	'uk',
// 	'vi',
// 	'zh-cn',
// 	'zh-tw',
// ]
/**
 * Reads the locales directory and returns
 * an array of supported language codes
 * (folder names only).
 *
 * @param {string} localesPath - Absolute or relative path to locales directory
 * @returns {string[]} Array of language codes
 */
function getSupportedLangs(localesPath: string) {
	const fullPath = path.resolve(localesPath);

	if (!fs.existsSync(fullPath)) {
		throw new Error(`Locales directory not found: ${fullPath}`);
	}

	return fs
		.readdirSync(fullPath, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);
}

export const SUPPORTED_LANGUAGES = getSupportedLangs(
	path.join(import.meta.dirname, 'locales'),
);

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
