import { app, Menu } from 'electron';
import { isDevMode } from '@electron/utils/app';
import { getResourcesPath } from '@electron/utils/files';
import { openMainWindow } from '@electron/windows/main/main';

console.log({
	isDev: isDevMode(),
	appDir: app.getAppPath(),
	resourcesPath: getResourcesPath(),
});

Menu.setApplicationMenu(null);
app.whenReady().then(() => {
	console.log('App ready');
	openMainWindow();
});
