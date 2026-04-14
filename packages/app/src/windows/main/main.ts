import { createEvent, createStore } from 'effector';
import { app, BrowserWindow, screen } from 'electron';
import windowStateKeeper from 'electron-window-state';
import path from 'path';
import url from 'url';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { AppContext } from '@electron/main/main';
import { enableContextMenu } from '@electron/requests/contextMenu/main';
import { enableElectronPatches } from '@electron/requests/electronPatches/main';
import { serveFiles } from '@electron/requests/files/main';
import { enableInteractions } from '@electron/requests/interactions/main';
import { serveInterop } from '@electron/requests/interop/main';
import { enableScreenLockNotifications } from '@electron/requests/screenLock/main';
import { enableStorage } from '@electron/requests/storage/main';
import { isDevMode } from '@electron/utils/app';
import { debounce } from '@utils/debounce/debounce';
import { createWatcher } from '@utils/effector/watcher';
import { joinCallbacks } from '@utils/react/joinCallbacks';

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
	i18n,
}: AppContext): Promise<MainWindowAPI> => {
	const cleanup = joinCallbacks(
		// Requests handlers
		serveFiles(),
		serveInterop(),
		enableStorage(),
		enableContextMenu(),
		enableInteractions(),
		enableElectronPatches(i18n),

		// Notifications
		enableScreenLockNotifications(),
	);

	// State
	const $windowState = createStore<WindowState>({
		hideByClose: true,
		isForcedClosing: false,
	});

	$windowState.on(quitRequested, (state) => ({ ...state, isForcedClosing: true }));

	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	const mainWindowState = windowStateKeeper({
		defaultWidth: Math.min(1400, Math.round(width * 0.8)),
		defaultHeight: Math.min(1000, Math.round(height * 0.9)),
	});

	// Open window
	const win = new BrowserWindow({
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,

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

	// Let us register listeners on the window, so we can update the state
	// automatically (the listeners will be removed when the window is closed)
	// and restore the maximized or full screen state
	mainWindowState.manage(win);

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
			cleanup();
		},
		openWindow: () => {
			if (win.isDestroyed()) return;

			if (win.isMinimized()) win.restore();

			win.show();
			win.focus();
		},
	};
};
