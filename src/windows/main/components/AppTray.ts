import { createApi, createStore } from 'effector';
import { nativeImage, Tray } from 'electron';
import path from 'path';
import { isPlatform } from '@electron/utils/platform';
import { CleanupFn, createWatcher } from '@utils/effector/watcher';

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
