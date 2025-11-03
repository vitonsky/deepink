/* eslint-disable spellcheck/spell-checker */
import { app, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';

import { openAboutWindow } from '../../windows/about';

export function createAppMenu() {
	type MenuObject = MenuItemConstructorOptions | MenuItem;
	const application: MenuObject = {
		label: 'Application',
		role: 'appMenu',
		submenu: [
			{
				label: 'About Application',
				click(_item, window) {
					openAboutWindow(window);
				},
			},
			{
				type: 'separator',
			},
			{
				label: 'Quit',
				accelerator: 'Command+Q',
				click: () => {
					app.quit();
				},
			},
		],
	};

	const edit: MenuObject = {
		label: 'Edit',
		submenu: [
			{
				label: 'Undo',
				accelerator: 'CmdOrCtrl+Z',
				role: 'undo',
			},
			{
				label: 'Redo',
				accelerator: 'Shift+CmdOrCtrl+Z',
				role: 'redo',
			},
			{
				type: 'separator',
			},
			{
				label: 'Cut',
				accelerator: 'CmdOrCtrl+X',
				role: 'cut',
			},
			{
				label: 'Copy',
				accelerator: 'CmdOrCtrl+C',
				role: 'copy',
			},
			{
				label: 'Paste',
				accelerator: 'CmdOrCtrl+V',
				role: 'paste',
			},
			{
				label: 'Select All',
				accelerator: 'CmdOrCtrl+A',
				role: 'selectAll',
			},
		],
	};

	return Menu.buildFromTemplate([
		application,
		edit,
		{
			label: 'Help',
			role: 'help',
			submenu: [
				{
					label: 'Toggle dev tools',
					role: 'toggleDevTools',
					accelerator: 'CmdOrCtrl+Alt+Shift+I',
				},
			],
		},
	]);
}
