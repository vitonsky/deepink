import { app, Menu } from 'electron';
import { openMainWindow } from 'src/windows/main/main';
import { isDevMode } from '@electron/utils/app';
import { getResourcesPath } from '@electron/utils/files';

import { createAppMenu } from './createAppMenu';

console.log({
	isDev: isDevMode(),
	appDir: app.getAppPath(),
	platform: process.platform,
	resourcesPath: getResourcesPath(),
	directory: __dirname,
});

app.setAboutPanelOptions({
	applicationName: 'Deepink',
	applicationVersion: '0.0.1-demo',
	authors: ['Robert Vitonsky'],
	website: 'https://google.com',
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
