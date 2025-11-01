import { app } from 'electron';
import { MainProcess } from '@electron/main/main';
import { isDevMode } from '@electron/utils/app';
import { getResourcesPath } from '@electron/utils/files';
import { detectLinuxDesktopEnv } from '@utils/os/detectLinuxDesktopEnv';

import { getAbout } from './about';

console.log({
	isDev: isDevMode(),
	appDir: app.getAppPath(),
	platform: process.platform,
	resourcesPath: getResourcesPath(),
	directory: __dirname,
	...(process.platform === 'linux'
		? { linuxEnvironment: detectLinuxDesktopEnv() }
		: {}),
});

const about = getAbout();
app.setAboutPanelOptions({
	applicationName: about.displayName,
	applicationVersion: about.version,
	authors: [about.author],
	website: about.homepage,
});

new MainProcess().start();
