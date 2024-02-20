import { createEvent, createStore } from 'effector';
import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron';
import path from 'path';
import url from 'url';
import { enableContextMenu } from '@electron/requests/contextMenu/main';
import { serveFiles } from '@electron/requests/files/main';
import { enableInteractions } from '@electron/requests/interactions/main';
import { enableStorage } from '@electron/requests/storage/main';
import { isDevMode } from '@electron/utils/app';
import { isPlatform } from '@electron/utils/platform';

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
	const appIcon = nativeImage.createFromPath(
		path.join(__dirname, 'assets/icons/app.png'),
	);
	const trayIcon = appIcon.resize({ width: 24 });
	trayIcon.setTemplateImage(true);

	const tray = new Tray(trayIcon);
	tray.setToolTip('Deepink');

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

	tray.addListener('click', () => {
		// Prevent immediately open window for mac by click on tray menu
		if (isPlatform('darwin')) return;

		openWindow();
	});

	const menu = Menu.buildFromTemplate([
		{ label: 'Open Deepink', click: openWindow },
		{ label: 'Quit', click: quit },
	]);

	tray.setContextMenu(menu);
};
