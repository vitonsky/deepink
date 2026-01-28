import { createEvent, createStore } from 'effector';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { AppContext } from '@electron/main/main';
import { enableConfirm } from '@electron/requests/confirm/main';
import { enableContextMenu } from '@electron/requests/contextMenu/main';
import { serveFiles } from '@electron/requests/files/main';
import { enableInteractions } from '@electron/requests/interactions/main';
import { enableStorage } from '@electron/requests/storage/main';
import { isDevMode } from '@electron/utils/app';
import { debounce } from '@utils/debounce/debounce';
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

export const openMainWindow = async ({
	telemetry,
}: AppContext): Promise<MainWindowAPI> => {
	// Requests handlers
	serveFiles();
	enableStorage();
	enableContextMenu();
	enableInteractions();
	enableConfirm();

	// State
	const $windowState = createStore<WindowState>({
		hideByClose: true,
		isForcedClosing: false,
	});

	$windowState.on(quitRequested, (state) => ({ ...state, isForcedClosing: true }));

	// Open window
	// TODO: remember size
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

	// Load page
	const start = performance.now();
	await win.loadURL(
		url.format({
			pathname: path.join(__dirname, 'window-main.html'),
			protocol: 'file:',
			slashes: true,
		}),
	);

	const pageLoadingMeasure = performance.measure('page loaded', { start });
	console.log(pageLoadingMeasure);
	telemetry.track(TELEMETRY_EVENT_NAME.MAIN_WINDOW_LOADED, {
		duration: Math.floor(pageLoadingMeasure.duration),
	});

	if (isDevMode()) {
		win.webContents.openDevTools();
	}
	win.webContents.on('devtools-opened', () => {
		telemetry.track(TELEMETRY_EVENT_NAME.DEV_TOOLS_TOGGLED, { state: 'opened' });
	});
	win.webContents.on('devtools-closed', () => {
		telemetry.track(TELEMETRY_EVENT_NAME.DEV_TOOLS_TOGGLED, { state: 'closed' });
	});

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

	const onTrackResize = () => {
		const [width, height] = win.getSize();
		return telemetry.track(TELEMETRY_EVENT_NAME.MAIN_WINDOW_RESIZE, {
			width,
			height,
		});
	};

	// We throttle to avoid intermediate changes, since
	// `resized` event works not on all platforms
	win.on('resize', debounce(onTrackResize, { wait: 5000 }));

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
