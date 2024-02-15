import { app } from 'electron';
import path from 'path';

import { isDevMode } from './app';

/**
 * Safe join path segments and resolve it
 *
 * In case resolved path are out of root path - thrown error
 */
export const joinPath = (root: string, ...segments: string[]) => {
	const resolvedPath = path.resolve(path.join(root, ...segments));
	if (!resolvedPath.startsWith(root)) {
		throw new TypeError('Resolved path is out of root directory');
	}

	return resolvedPath;
};

export const getResourcesPath = (resourcePath?: string) => {
	const rootPath = isDevMode()
		? joinPath(app.getAppPath(), 'dist')
		: process.resourcesPath;
	return resourcePath ? joinPath(rootPath, resourcePath) : rootPath;
};

export const getUserDataPath = (resourcePath?: string) => {
	// Docs: https://www.electronjs.org/docs/latest/api/app#appgetpathname
	const rootPath = isDevMode()
		? joinPath(app.getAppPath(), 'tmp')
		: app.getPath('userData');
	return resourcePath ? joinPath(rootPath, resourcePath) : rootPath;
};
