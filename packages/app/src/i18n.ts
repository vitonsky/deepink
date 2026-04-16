export enum LOCALE_NAMESPACE {
	common = 'common',
	vault = 'vault',
	workspace = 'workspace',
	features = 'features',
	settings = 'settings',
	menu = 'menu',
}

export const NAMESPACES = Object.values(LOCALE_NAMESPACE);

export const supportedLanguages = ['en', 'ru'];
