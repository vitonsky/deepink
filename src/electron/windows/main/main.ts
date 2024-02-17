import { BrowserWindow, Tray } from 'electron';
import path from 'path';
import url from 'url';
import { enableContextMenu } from '@electron/requests/contextMenu/main';
import { serveFiles } from '@electron/requests/files/main';
import { enableInteractions } from '@electron/requests/interactions/main';
import { enableStorage } from '@electron/requests/storage/main';
import { isDevMode } from '@electron/utils/app';

export const openMainWindow = async () => {
	serveFiles();
	enableStorage();
	enableContextMenu();
	enableInteractions();

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

	if (isDevMode()) {
		win.webContents.openDevTools();
	}

	const start = performance.now();

	await win.loadURL(
		url.format({
			pathname: path.join(__dirname, 'index.html'),
			protocol: 'file:',
			slashes: true,
		}),
	);

	console.log(performance.measure('page loaded', { start }));

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
