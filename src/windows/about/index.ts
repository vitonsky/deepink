import { BaseWindow, BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';
import { enableConfirm } from '@electron/requests/electronPatches/main';

export const openAboutWindow = async (parent?: BaseWindow) => {
	enableConfirm();

	const win = new BrowserWindow({
		width: 600,
		height: 700,
		resizable: false,
		show: false,
		backgroundColor: '#fff', // required to enable sub pixel rendering, can't be in css
		webPreferences: {
			preload: path.join(__dirname, 'window-about-preload.js'),
			nodeIntegration: false,
			contextIsolation: true,
			spellcheck: true,
		},
	});

	win.setMenu(null);

	// Close with parent
	if (parent) {
		parent.once('close', () => {
			if (!win.isDestroyed()) win.close();
		});
	}

	// Load page
	await win.loadURL(
		url.format({
			pathname: path.join(__dirname, 'window-about.html'),
			protocol: 'file:',
			slashes: true,
		}),
	);

	// Show only when content is loaded
	win.show();

	return win;
};
