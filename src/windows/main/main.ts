import { createEvent, createStore } from 'effector';
import { BrowserWindow, Menu, Tray } from 'electron';
import path from 'path';
import url from 'url';
import { enableContextMenu } from '@electron/requests/contextMenu/main';
import { serveFiles } from '@electron/requests/files/main';
import { enableInteractions } from '@electron/requests/interactions/main';
import { enableStorage } from '@electron/requests/storage/main';
import { isDevMode } from '@electron/utils/app';

type WindowState = {
	hideByClose: boolean;
	isForcedClosing: boolean;
};

const quitRequested = createEvent();

export const openMainWindow = async () => {
	serveFiles();
	enableStorage();
	enableContextMenu();
	enableInteractions();

	const $windowState = createStore<WindowState>({
		hideByClose: true,
		isForcedClosing: false,
	});

	$windowState.on(quitRequested, (state) => ({ ...state, isForcedClosing: true }));

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
			pathname: path.join(__dirname, 'window-main.html'),
			protocol: 'file:',
			slashes: true,
		}),
	);

	console.log(performance.measure('page loaded', { start }));

	// Hide instead of close
	const $shouldBeClosed = $windowState.map(
		({ hideByClose, isForcedClosing }) => !hideByClose || isForcedClosing,
	);
	win.addListener('close', (evt) => {
		// Allow to close window
		if ($shouldBeClosed.getState()) {
			return;
		}

		evt.preventDefault();
		win.hide();
	});

	const tray = new Tray(path.join(__dirname, 'assets/icons/app.png'));
	tray.setToolTip('Tooltip text');

	const openWindow = () => {
		if (!win.isVisible()) {
			win.show();
		}

		if (!win.isFocused()) {
			win.focus();
		}
	};

	const quit = () => {
		quitRequested();
		win.close();
	};

	tray.addListener('click', openWindow);

	const menu = Menu.buildFromTemplate([
		{ label: 'Open Deepink', click: openWindow },
		{ label: 'Quit', click: quit },
	]);

	tray.setContextMenu(menu);
};
