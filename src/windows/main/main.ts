import { createEvent, createStore } from 'effector';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';
import { enableContextMenu } from '@electron/requests/contextMenu/main';
import { serveFiles } from '@electron/requests/files/main';
import { enableInteractions } from '@electron/requests/interactions/main';
import { enableStorage } from '@electron/requests/storage/main';
import { isDevMode } from '@electron/utils/app';
import { createWatcher } from '@utils/effector/watcher';

export type MainWindowAPI = {
	quit: () => void;
	openWindow: () => void;
};

type WindowState = {
	hideByClose: boolean;
	isForcedClosing: boolean;
};

const quitRequested = createEvent();

export const openMainWindow = async (): Promise<MainWindowAPI> => {
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

		// Auto hide menu on linux and windows
		autoHideMenuBar: true,

		// show: false,
		backgroundColor: '#fff', // required to enable sub pixel rendering, can't be in css
		webPreferences: {
			preload: path.join(__dirname, 'window-main-preload.js'),
			nodeIntegration: false,
			contextIsolation: true,
			spellcheck: true,
		},
	});

	if (isDevMode()) {
		win.webContents.openDevTools();
	}

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
			if (shouldBeClosed) return;

			// Hide window instead of close
			evt.preventDefault();
			win.hide();

			// Hide app in dock
			if (app.dock) {
				app.dock.hide();
			}
		};

		win.addListener('close', onClose);
		return () => {
			win.removeListener('close', onClose);
		};
	});

	// Show app in dock always when window becomes visible
	win.addListener('show', () => {
		if (app.dock) {
			app.dock.show();
		}
	});

	return {
		quit: () => {
			if (win.isDestroyed()) return;

			quitRequested();
			win.close();
		},
		openWindow: () => {
			if (win.isDestroyed()) return;

			if (win.isMinimized()) win.restore();

			win.show();
			win.focus();
		},
	};
};
