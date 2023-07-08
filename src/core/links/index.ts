import { Uri } from "monaco-editor-core";

export const appLinkPrefix = 'deepink';

export const formatAppLink = (resourceId: string) => `${appLinkPrefix}://${resourceId}`;

export const findLinksInText = (text: string) => {
	return Array.from(text.matchAll(/deepink:\/\/[\d\a-z\-]+/gi)).map((match) => {
		const index = match.index as number;
		const url = match[0] as string;

		return { index, url };
	});
};

export const getResourceIdInUrl = (url: URL | Uri) => {
	if (url instanceof URL) {
		if (url.protocol !== appLinkPrefix) return null;
		return url.host || null;
	}

	if (url.scheme !== appLinkPrefix) return null;
	return url.authority || null;
};