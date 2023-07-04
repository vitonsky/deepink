import { app } from 'electron';
import path from 'path';

import { isDevMode } from './app';

export const getResourcesPath = (resourcePath?: string) => {
	const rootPath = isDevMode()
		? path.join(app.getAppPath(), 'dist')
		: process.resourcesPath;
	return resourcePath ? path.join(rootPath, resourcePath) : rootPath;
};

export const getUserDataPath = (resourcePath?: string) => {
	// Docs: https://www.electronjs.org/docs/latest/api/app#appgetpathname
	const rootPath = isDevMode()
		? path.join(app.getAppPath(), 'tmp')
		: app.getPath('userData');
	return resourcePath ? path.join(rootPath, resourcePath) : rootPath;
};
