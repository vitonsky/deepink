import type { ResourceKey } from 'i18next';

export type i18nPageContext = {
	language: string;
	resources: Record<string, ResourceKey>;

	/**
	 * Alt versions of current page
	 */
	altVersions: {
		url: string;
		langCode: string;
	}[];
};
