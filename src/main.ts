import { app, BrowserWindow, Menu, Tray } from 'electron';
import path from 'path';
import url from 'url';

import { enableContextMenu } from './electron/requests/contextMenu/main';
import { serveFiles } from './electron/requests/files/main';
import { handleInteractionsRequests } from './electron/requests/interactions/main';
import { enableStorage } from './electron/requests/storage/main';
import { isDevMode } from './electron/utils/app';
import { getResourcesPath } from './electron/utils/files';

console.log({
	isDev: isDevMode(),
	appDir: app.getAppPath(),
	resourcesPath: getResourcesPath(),
});

serveFiles();

const createWindow = async () => {
	const win = new BrowserWindow({
		width: 1300,
		height: 800,
		// show: false,
		backgroundColor: '#fff', // required to enable sub pixel rendering, can't be in css
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			spellcheck: true,
		},
	});

	win.webContents.openDevTools();

	const start = performance.now();
	// win.addListener('ready-to-show', () => {
	// 	console.log(performance.measure('ready to show', { start }));
	// 	win.show();
	// });

	await win.loadURL(
		url.format({
			pathname: path.join(__dirname, 'index.html'),
			protocol: 'file:',
			slashes: true,
		}),
	);

	console.log(performance.measure('page loaded', { start }));

	enableContextMenu();
	enableStorage();
	handleInteractionsRequests.forEach((handler) => handler());

	// win.addListener('close', (evt) => {
	// 	evt.preventDefault();
	// 	win.minimize();
	// });

	const tray = new Tray(path.join(__dirname, 'assets/icons/app.png'));
	tray.setToolTip('Tooltip text');

	tray.addListener('click', () => {
		if (!win.isMinimized()) return;

		win.minimize();
	});
};

Menu.setApplicationMenu(null);
app.whenReady().then(() => {
	console.log('App ready');
	createWindow();
});
