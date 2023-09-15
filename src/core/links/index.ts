import { Uri } from 'monaco-editor-core';

export const resourceProtocolName = 'res';

export const formatResourceLink = (resourceId: string) =>
	`${resourceProtocolName}://${resourceId}`;

export const findLinksInText = (
	text: string,
): Array<{
	index: number;
	url: string;
}> => {
	return Array.from(
		text.matchAll(new RegExp(`${resourceProtocolName}:\\/\\/[\\da-z\\-]+`, 'gi')),
	).map((match) => {
		const index = match.index;
		const url = match[0];

		if (index === undefined) throw new TypeError('Substring index not found');

		return { index, url };
	});
};

export const getResourceIdInUrl = (url: URL | Uri | string) => {
	if (typeof url === 'string') {
		const urlPrefix = resourceProtocolName + '://';
		if (!url.startsWith(urlPrefix)) return null;
		return url.slice(urlPrefix.length);
	}

	if (url instanceof URL) {
		if (url.protocol !== resourceProtocolName) return null;
		return url.host || null;
	}

	if (url.scheme !== resourceProtocolName) return null;
	return url.authority || null;
};
