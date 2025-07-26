import { app, Menu } from 'electron';
import { openMainWindow } from 'src/windows/main/main';
import { isDevMode } from '@electron/utils/app';
import { getResourcesPath } from '@electron/utils/files';

console.log({
	isDev: isDevMode(),
	appDir: app.getAppPath(),
	resourcesPath: getResourcesPath(),
});

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

	openMainWindow();
});
