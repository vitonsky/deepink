import { app, Menu } from 'electron';
import { Plausible } from 'plausible-client';
import { MainWindowAPI, openMainWindow } from 'src/windows/main/main';
import { FileController } from '@core/features/files/FileController';
import { NodeFS } from '@core/features/files/NodeFS';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { AppVersions } from '@core/features/telemetry/AppVersions';
import { Telemetry } from '@core/features/telemetry/Telemetry';
import { AppTray } from '@electron/main/AppTray';
import { serveTelemetry } from '@electron/requests/telemetry/main';
import { isDevMode } from '@electron/utils/app';
import { getUserDataPath } from '@electron/utils/files';
import { openUrlWithExternalBrowser } from '@electron/utils/shell';

import { createAppMenu } from './createAppMenu';
import { createTelemetrySession } from './createTelemetrySession';

const onShutdown = (callback: () => any) => {
	process.once('beforeExit', callback);
	process.once('SIGTERM', callback);
	process.once('SIGINT', callback);

	return () => {
		process.off('beforeExit', callback);
		process.off('SIGTERM', callback);
		process.off('SIGINT', callback);
	};
};

export class MainProcess {
	private readonly userDataFs;
	constructor() {
		this.userDataFs = new NodeFS({ root: getUserDataPath() });
	}

	private tray: AppTray | null = null;
	public async start() {
		// TODO: pass arguments when take a lock
		const gotTheLock = app.requestSingleInstanceLock();

		// Quit instantly if can't get lock
		if (!gotTheLock) {
			console.log('Close app because another instance is already opened');
			app.quit();
			return;
		}

		// Init app
		this.setListeners();
		Menu.setApplicationMenu(createAppMenu());

		// Init tray
		this.tray = new AppTray({
			openWindow: () => {
				this.mainWindow?.openWindow();
			},
		});
		this.tray.enable();
		this.tray.update(
			Menu.buildFromTemplate([
				{
					label: 'Quit',
					click: () => this.quit(),
				},
			]),
		);

		app.whenReady().then(() => this.onReady());
	}

	public quit() {
		if (this.mainWindow) {
			this.mainWindow.quit();
			this.mainWindow = null;
		}

		app.exit();
	}

	private mainWindow: MainWindowAPI | null = null;
	private async onReady() {
		console.log('App ready');

		// Force app shutdown by OS requests
		onShutdown(() => this.quit());

		const telemetry = await this.setupTelemetry();

		telemetry.track(TELEMETRY_EVENT_NAME.APP_OPENED);
		app.once('window-all-closed', async () => {
			await telemetry.track(TELEMETRY_EVENT_NAME.APP_CLOSED);
			this.quit();
		});

		if (isDevMode()) {
			console.log('Install dev tools');

			const { installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } =
				await import(
					// eslint-disable-next-line spellcheck/spell-checker
					'electron-devtools-installer'
				);

			await Promise.all(
				[REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].map((extension) =>
					installExtension(extension, {
						loadExtensionOptions: { allowFileAccess: true },
					})
						.then((ext) => console.log(`Added Extension:  ${ext.name}`))
						.catch((err) => console.log('An error occurred: ', err)),
				),
			);
		}

		this.mainWindow = await openMainWindow();

		if (this.tray) {
			this.tray.update(
				this.tray.update(
					Menu.buildFromTemplate([
						{
							label: `Open notes`,
							click: () => {
								this.mainWindow?.openWindow();
							},
						},
						{
							label: 'Quit',
							click: () => this.quit(),
						},
					]),
				),
			);
		}
	}

	private setListeners() {
		// Handle attempts to open new instance of app
		app.on(
			'second-instance',
			(_event, _commandLine, _workingDirectory, additionalData) => {
				// Print out data received from the second instance.
				console.log(
					'Another app instance just requested a single instance lock',
					additionalData,
				);

				// Someone tried to run a second instance, we should focus our window.
				if (this.mainWindow) {
					this.mainWindow.openWindow();
				}
			},
		);

		// Open external links in default browser
		app.on('web-contents-created', (_event, webContents) => {
			webContents.setWindowOpenHandler(({ url }) => {
				console.log(
					'Prevent open new window, and open URL as external link',
					url,
				);

				openUrlWithExternalBrowser(url);

				return { action: 'deny' };
			});

			webContents.on('will-navigate', (event, url) => {
				if (url !== webContents.getURL()) {
					console.log(
						'Prevent navigation in main window, and open URL as external link',
						url,
					);

					event.preventDefault();
					openUrlWithExternalBrowser(url);
				}
			});
		});
	}

	private async setupTelemetry() {
		const appVersions = new AppVersions(
			app.getVersion(),
			new FileController('meta/versions.json', this.userDataFs),
		);
		const initVersions = await appVersions.getInfo();
		await appVersions.logVersion();

		// TODO: use real config
		const plausible = new Plausible({
			apiHost: 'https://uxt.vitonsky.net',
			domain: 'test',
			filter() {
				const shouldSend = !isDevMode();
				return shouldSend;
			},
		});

		const telemetry = new Telemetry(
			new FileController('meta/telemetry.json', this.userDataFs),
			plausible,
			{
				contextProps: createTelemetrySession(initVersions),
				onEventSent(event) {
					if (isDevMode()) {
						console.log('Telemetry data', event);
					}
				},
			},
		);

		// Log app installs and updates
		if (initVersions.isJustInstalled) {
			await telemetry.track(TELEMETRY_EVENT_NAME.APP_INSTALLED);
		} else if (initVersions.isVersionUpdated) {
			await telemetry.track(TELEMETRY_EVENT_NAME.APP_UPDATED, {
				previousVersion: initVersions.previousVersion?.version,
			});
		}

		serveTelemetry(telemetry);

		return telemetry;
	}
}
