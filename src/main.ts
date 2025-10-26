import { app, Menu } from 'electron';
import { openMainWindow } from 'src/windows/main/main';
import { isDevMode } from '@electron/utils/app';
import { getResourcesPath } from '@electron/utils/files';
import { isPlatform } from '@electron/utils/platform';

import { createAppMenu } from './createAppMenu';

console.log({
	isDev: isDevMode(),
	appDir: app.getAppPath(),
	resourcesPath: getResourcesPath(),
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

Menu.setApplicationMenu(null);
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

app.on('ready', () => {
	// Add application menu for mac
	if (isPlatform('darwin')) {
		Menu.setApplicationMenu(createAppMenu());
	}
});
