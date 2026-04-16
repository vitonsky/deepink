import { app, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';

import { openAboutWindow } from '../../windows/about';

import { AppContext } from './main';

export function createAppMenu(appContext: AppContext) {
	const { telemetry, i18n } = appContext;

	type MenuObject = MenuItemConstructorOptions | MenuItem;
	const application: MenuObject = {
		label: i18n('app.appMenu', { ns: LOCALE_NAMESPACE.menu }),
		role: 'appMenu',
		submenu: [
			{
				label: i18n('app.about', { ns: LOCALE_NAMESPACE.menu }),
				click(_item, window) {
					openAboutWindow(appContext, window);

					telemetry.track(TELEMETRY_EVENT_NAME.ABOUT_WINDOW_CLICK);
				},
			},
			{
				type: 'separator',
			},
			{
				label: i18n('app.quit', { ns: LOCALE_NAMESPACE.menu }),
				accelerator: 'Command+Q',
				click: () => {
					app.quit();
				},
			},
		],
	};

	const edit: MenuObject = {
		label: i18n('app.edit', { ns: LOCALE_NAMESPACE.menu }),
		submenu: [
			{
				accelerator: 'CmdOrCtrl+Z',
				role: 'undo',
				label: i18n('app.undo', { ns: LOCALE_NAMESPACE.menu }),
			},
			{
				accelerator: 'Shift+CmdOrCtrl+Z',
				role: 'redo',
				label: i18n('app.redo', { ns: LOCALE_NAMESPACE.menu }),
			},
			{
				type: 'separator',
			},
			{
				accelerator: 'CmdOrCtrl+X',
				role: 'cut',
				label: i18n('app.cut', { ns: LOCALE_NAMESPACE.menu }),
			},
			{
				accelerator: 'CmdOrCtrl+C',
				role: 'copy',
				label: i18n('app.copy', { ns: LOCALE_NAMESPACE.menu }),
			},
			{
				accelerator: 'CmdOrCtrl+V',
				role: 'paste',
				label: i18n('app.paste', { ns: LOCALE_NAMESPACE.menu }),
			},
			{
				accelerator: 'CmdOrCtrl+A',
				role: 'selectAll',
				label: i18n('app.selectAll', { ns: LOCALE_NAMESPACE.menu }),
			},
		],
	};

	return Menu.buildFromTemplate([
		application,
		edit,
		{
			label: i18n('app.help', { ns: LOCALE_NAMESPACE.menu }),
			role: 'help',
			submenu: [
				{
					label: i18n('app.toggleDevTools', { ns: LOCALE_NAMESPACE.menu }),
					role: 'toggleDevTools',
					accelerator: 'CmdOrCtrl+Alt+Shift+I',
				},
			],
		},
	]);
}
