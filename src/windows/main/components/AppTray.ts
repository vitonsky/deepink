import { createApi, createStore } from 'effector';
import { nativeImage, Tray } from 'electron';
import path from 'path';
import { getAbout } from 'src/about';
import { CleanupFn } from '@utils/effector/watcher';
import { detectLinuxDesktopEnv } from '@utils/os/detectLinuxDesktopEnv';

export type AppTrayProps = { openWindow: () => void };

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
		tray.setToolTip(getAbout().displayName);

		const cleanups: Array<() => void> = [];
		if (process.platform === 'win32' || process.platform === 'darwin') {
			// Show app by click
			tray.addListener('click', () => {
				this.api.openWindow();
			});

			// Show menu by right click (for win,darwin platforms only)
			tray.addListener('right-click', () => {
				const menu = this.$trayMenu.getState();
				if (menu) {
					tray.popUpContextMenu(menu);
				}
			});
		} else {
			const linuxEnv = detectLinuxDesktopEnv();

			// Update menu by changes
			cleanups.push(this.$trayMenu.watch((menu) => tray.setContextMenu(menu)));

			// Open app by click tray for DE that will not to show menu
			if (linuxEnv === 'kde') {
				tray.addListener('click', () => {
					this.api.openWindow();
				});
			}
		}

		this.trayCleanup = () => {
			tray.destroy();
			this.$trayMenu.reset();
			cleanups.forEach((cleanup) => cleanup());
		};
	}

	public disable() {
		if (!this.trayCleanup) throw new Error('Tray is not enabled');

		this.trayCleanup();
	}
}
