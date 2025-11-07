import { app, Menu } from 'electron';
import { Plausible } from 'plausible-client';
import { MainWindowAPI, openMainWindow } from 'src/windows/main/main';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { Telemetry } from '@core/features/telemetry/Telemetry';
import { serveTelemetry } from '@electron/requests/telemetry/main';
import { isDevMode } from '@electron/utils/app';
import { openUrlWithExternalBrowser } from '@electron/utils/shell';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { createAppMenu } from './createAppMenu';

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
		app.whenReady().then(() => this.onReady());
	}

	private window: MainWindowAPI | null = null;
	private async onReady() {
		console.log('App ready');

		const telemetry = this.setupTelemetry();

		telemetry.track(TELEMETRY_EVENT_NAME.APP_OPENED);

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

		// TODO: manage tray here, in entrypoint class
		const windowControls = await openMainWindow();
		this.window = windowControls;

		app.on('window-all-closed', async () => {
			await telemetry.track(TELEMETRY_EVENT_NAME.APP_CLOSED);
			app.quit();
		});

		// Force app shutdown
		onShutdown(() => {
			windowControls.quit();
			this.window = null;

			app.exit();
		});
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
				if (this.window) {
					this.window.openWindow();
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

	private setupTelemetry() {
		// TODO: use real config
		const plausible = new Plausible({
			apiHost: 'https://uxt.vitonsky.net',
			domain: 'test',
		});

		const telemetryStateFile = createFileControllerMock();
		const telemetry = new Telemetry(telemetryStateFile, plausible, {
			onEventSent: console.log,
			contextProps: {
				version: app.getVersion(),
			},
		});

		serveTelemetry(telemetry);

		return telemetry;
	}
}
