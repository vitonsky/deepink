import { createApi, createEvent, createStore, Store } from 'effector';
import { app, BrowserWindow, globalShortcut, Menu, nativeImage, Tray } from 'electron';
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

type CleanupFn = () => void;
type CallbackWithCleanup<T extends unknown[]> = (...args: T) => void | (() => void);

const createCleanable = <T extends unknown[]>(callback: CallbackWithCleanup<T>) => {
	let cleanupFn: null | (() => void) = null;

	const cleanup = () => {
		if (!cleanupFn) return;

		cleanupFn();
		cleanupFn = null;
	};

	const call = (...args: T) => {
		cleanup();
		cleanupFn = callback(...args) ?? null;
	};

	return Object.assign(call, { cleanup });
};

const createWatcher = <T extends unknown>(
	store: Store<T>,
	callback: CallbackWithCleanup<[T]>,
) => {
	const wrappedCallback = createCleanable(callback);

	const subscribe = store.watch(wrappedCallback);

	return () => {
		subscribe.unsubscribe();
		wrappedCallback.cleanup();
	};
};

type AppTrayProps = { openWindow: () => void };
export class AppTray {
	private readonly api;
	private readonly $trayMenu;
	constructor(api: AppTrayProps) {
		this.api = api;

		this.$trayMenu = createStore<Electron.Menu | null>(null);

		const trayMenu = createApi(this.$trayMenu, {
			update(_state, menu: Electron.Menu | null) {
				return menu;
			},
		});

		this.update = trayMenu.update;
	}

	public readonly update;

	private trayCleanup: CleanupFn | null = null;
	public enable() {
		if (this.trayCleanup) throw new Error('Tray already enabled');

		// Tray
		const appIcon = nativeImage.createFromPath(
			path.join(__dirname, 'assets/icons/app.png'),
		);
		const trayIcon = appIcon.resize({ width: 24 });
		trayIcon.setTemplateImage(true);

		const tray = new Tray(trayIcon);
		tray.setToolTip('Deepink');

		tray.addListener('click', () => {
			// Prevent immediately open window for mac by click on tray menu
			if (isPlatform('darwin')) return;

			this.api.openWindow();
		});

		const menuCleanup = createWatcher(this.$trayMenu, (menu) => {
			tray.setContextMenu(menu);
		});

		this.trayCleanup = () => {
			menuCleanup();
			tray.destroy();
			this.$trayMenu.reset();
		};
	}

	public disable() {
		if (!this.trayCleanup) throw new Error('Tray is not enabled');

		this.trayCleanup();
	}
}

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
