import { shell } from 'electron';

export const openUrlWithExternalBrowser = async (url: string) => {
	// Validate URL, to prevent execute random commands
	// Read the docs https://www.electronjs.org/docs/latest/tutorial/security#15-do-not-use-shellopenexternal-with-untrusted-content
	try {
		const urlObject = new URL(url);

		if (!/^https?:$/.test(urlObject.protocol))
			throw new TypeError('Incorrect protocol');
	} catch (error) {
		console.error('Invalid url', url);
		throw error;
	}

	return shell.openExternal(url).catch((error) => {
		console.error(`Failed to open link ${url}`, error);
	});
};
