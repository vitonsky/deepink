import type { ResourceKey } from 'i18next';

export type i18nPageContext = {
	language: string;
	resources: Record<string, ResourceKey>;

	// TODO: provide alt versions info on top level
	// altVersions: {
	// 	url: string;
	// 	langCode: string;
	// }[];
	supportedLanguages: string[];
};
