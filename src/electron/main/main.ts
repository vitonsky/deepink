import 'dotenv/config';

import chalk from 'chalk';
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
import { getConfig } from '@utils/os/getConfig';
import { wait } from '@utils/tests';

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

export type AppContext = {
	telemetry: Telemetry;
};

export class MainProcess {
	private readonly userDataFs;
	constructor() {
		this.userDataFs = new NodeFS({ root: getUserDataPath() });
	}

	public async start() {
		// TODO: pass arguments when take a lock
		const gotTheLock = app.requestSingleInstanceLock();

		// Quit instantly if can't get lock
		if (!gotTheLock) {
			console.log('Close app because another instance is already opened');
			app.quit();
			return;
		}

		// Force app shutdown by OS requests
		onShutdown(() => this.quit());

		// Init app
		this.setListeners();

		app.whenReady().then(() => this.onReady());
	}

	private isQuitInProcess = false;
	public async quit() {
		if (this.isQuitInProcess) return;
		this.isQuitInProcess = true;

		// Clear context
		if (this.mainWindow) {
			this.mainWindow.quit();
			this.mainWindow = null;
		}

		// Clear context
		if (this.context) {
			const { telemetry } = this.context;
			this.context = null;

			await telemetry.track(TELEMETRY_EVENT_NAME.APP_CLOSED);
		}

		app.exit();
	}

	private mainWindow: MainWindowAPI | null = null;
	private context: {
		tray: AppTray;
		telemetry: Telemetry;
	} | null = null;
	private async onReady() {
		console.log('App ready');

		// Setup telemetry
		const telemetry = await this.setupTelemetry();

		telemetry.track(TELEMETRY_EVENT_NAME.APP_OPENED);
		app.once('window-all-closed', () => this.quit());

		// Init tray
		const tray = new AppTray({
			openWindow: () => {
				this.mainWindow?.openWindow();
			},
		});
		tray.enable();
		tray.update(
			Menu.buildFromTemplate([
				{
					label: 'Quit',
					click: () => this.quit(),
				},
			]),
		);

		this.context = { telemetry, tray };

		// Install dev tools
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

		// Create main window
		Menu.setApplicationMenu(createAppMenu({ telemetry }));
		this.mainWindow = await openMainWindow({ telemetry });
		tray.update(
			tray.update(
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
		const {
			telemetry: { enabled: shouldSend, verbose, syncInterval },
		} = getConfig();

		if (verbose) {
			console.log(chalk.magenta('Telemetry config'), {
				shouldSend,
				verbose,
				syncInterval,
			});
		}

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
				return shouldSend;
			},
		});

		const telemetry = new Telemetry(
			new FileController('meta/telemetry.json', this.userDataFs),
			plausible,
			{
				contextProps: createTelemetrySession(initVersions),
				onEventSent(event) {
					if (verbose) {
						console.log(chalk.magenta('Telemetry > Event'), event);
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

		// Handle queue in background periodically
		const runQueueDaemon = async () => {
			while (true) {
				const result = await telemetry.handleQueue();
				if (verbose) {
					console.log(
						chalk.magenta(
							`Telemetry > Handled queued events ${result.processed}/${result.total}`,
						),
					);
				}

				if (result.processed > 0) {
					await telemetry.track(
						TELEMETRY_EVENT_NAME.TELEMETRY_QUEUE_PROCESSED,
						result,
					);
				}

				await wait(syncInterval);
			}
		};

		runQueueDaemon();

		return telemetry;
	}
}
