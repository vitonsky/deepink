import { app, Menu } from 'electron';
import { openMainWindow } from 'src/windows/main/main';
import { isDevMode } from '@electron/utils/app';
import { getResourcesPath } from '@electron/utils/files';

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
