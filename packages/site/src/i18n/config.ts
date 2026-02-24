import fs from 'node:fs';
import path from 'node:path';

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
// export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type SupportedLanguage = string;
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
