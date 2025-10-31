import { app, Menu } from 'electron';
import { openMainWindow } from 'src/windows/main/main';
import { isDevMode } from '@electron/utils/app';
import { getResourcesPath } from '@electron/utils/files';
import { openUrlWithExternalBrowser } from '@electron/utils/shell';

import { getAbout } from './about';
import { createAppMenu } from './createAppMenu';

console.log({
	isDev: isDevMode(),
	appDir: app.getAppPath(),
	platform: process.platform,
	resourcesPath: getResourcesPath(),
	directory: __dirname,
});

const about = getAbout();
app.setAboutPanelOptions({
	applicationName: about.displayName,
	applicationVersion: about.version,
	authors: [about.author],
	website: about.homepage,
});

app.addListener('web-contents-created', (_event, webContents) => {
	webContents.setWindowOpenHandler(({ url }) => {
		console.log('Prevent open new window, and open URL as external link', url);

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

// Set custom menu
Menu.setApplicationMenu(null);
app.on('ready', () => {
	Menu.setApplicationMenu(createAppMenu());
});

app.whenReady().then(async () => {
	console.log('App ready');

	if (isDevMode()) {
		console.log('Install dev tools');

		const { installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = await import(
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

	const windowControls = await openMainWindow();

	// Force app shutdown
	onShutdown(() => {
		windowControls.quit();
		app.exit();
	});
});
