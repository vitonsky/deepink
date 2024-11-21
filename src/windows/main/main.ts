import { createEvent, createStore } from 'effector';
import { app, BrowserWindow, globalShortcut, Menu } from 'electron';
import path from 'path';
import url from 'url';
import { enableContextMenu } from '@electron/requests/contextMenu/main';
import { serveFiles } from '@electron/requests/files/main';
import { enableInteractions } from '@electron/requests/interactions/main';
import { enableStorage } from '@electron/requests/storage/main';
import { isDevMode } from '@electron/utils/app';
import { isPlatform } from '@electron/utils/platform';
import { openUrlWithExternalBrowser } from '@electron/utils/shell';
import { createWatcher } from '@utils/effector/watcher';

import { AppTray } from './components/AppTray';

type WindowState = {
	hideByClose: boolean;
	isForcedClosing: boolean;
};

const quitRequested = createEvent();

export const openMainWindow = async () => {
	// Requests handlers
	serveFiles();
	enableStorage();
	enableContextMenu();
	enableInteractions();

	// State
	const $windowState = createStore<WindowState>({
		hideByClose: true,
		isForcedClosing: false,
	});

	$windowState.on(quitRequested, (state) => ({ ...state, isForcedClosing: true }));

	// Open window
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

	win.webContents.setWindowOpenHandler(({ url }) => {
		console.log('Prevent open new window, and open URL as external link', url);

		openUrlWithExternalBrowser(url);

		return { action: 'deny' };
	});

	win.webContents.on('will-navigate', (event, url) => {
		if (url !== win.webContents.getURL()) {
			console.log(
				'Prevent navigation in main window, and open URL as external link',
				url,
			);

			event.preventDefault();
			openUrlWithExternalBrowser(url);
		}
	});

	if (isDevMode()) {
		win.webContents.openDevTools();
	}

	// Toggle dev tools
	// eslint-disable-next-line spellcheck/spell-checker
	globalShortcut.register('CmdOrCtrl+Alt+Shift+I', () => {
		if (!win.isFocused()) return;

		win.webContents.toggleDevTools();
	});

	// Load page
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

	createWatcher($shouldBeClosed, (shouldBeClosed) => {
		const onClose = (evt: { preventDefault: () => void }) => {
			// Allow to close window
			if (shouldBeClosed) {
				return;
			}

			evt.preventDefault();
			win.hide();
		};

		win.addListener('close', onClose);
		return () => {
			win.removeListener('close', onClose);
		};
	});

	// Dock
	win.addListener('hide', () => {
		if (win.isMinimized()) return;

		if (isPlatform('darwin')) {
			app.dock.hide();
		}
	});

	win.addListener('show', () => {
		if (isPlatform('darwin')) {
			app.dock.show();
		}
	});

	// Tray
	const trayApi = {
		quit: () => {
			quitRequested();
			win.close();
		},
		openWindow: () => {
			if (!win.isVisible()) {
				win.show();
			}

			if (!win.isFocused()) {
				win.focus();
			}
		},
	};

	const appTray = new AppTray(trayApi);
	appTray.enable();
	appTray.update(
		Menu.buildFromTemplate([
			{ label: `Open Deepink`, click: trayApi.openWindow },
			{ label: 'Quit', click: trayApi.quit },
		]),
	);
};
