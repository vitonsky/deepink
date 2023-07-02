import { BrowserWindow, ipcMain, Menu } from 'electron';

import { noteMenu } from './menus/NoteMenu';
import { ContextMenu, ipcChannelName } from '.';

export const enableContextMenu = () => {
	const menus: ContextMenu[] = [noteMenu];

	ipcMain.handle(ipcChannelName, (event, props = {}) => {
		const targetWindow = BrowserWindow.fromWebContents(event.sender);
		if (!targetWindow) return;

		const { menuId, x = 0, y = 0 } = props;

		const menuTemplate = menus.find(({ id }) => id === menuId);
		if (!menuTemplate) {
			throw new Error(`Not found menu with id "${menuId}"`);
		}

		// Handle click on menu
		let onClick: (itemId: string | null) => void;
		const onClickPromise = new Promise<string | null>((res) => {
			onClick = res;
		});

		const prepareMenu = (menu: Electron.MenuItemConstructorOptions[]) => {
			return menu.map(({ id, click, ...props }) => {
				// Decorate click handler, to resolve promise with menu id by click on menu
				const clickHandler =
					id === undefined ? click
						: (
							menuItem: Electron.MenuItem,
							browserWindow: Electron.BrowserWindow | undefined,
							event: Electron.KeyboardEvent,
						) => {
							if (click) click(menuItem, browserWindow, event);
							onClick(id);
						};

				return { id, click: clickHandler, ...props };
			});
		};

		const menu = Menu.buildFromTemplate(prepareMenu(menuTemplate.menu));

		menu.popup({ window: targetWindow, x, y });
		menu.once('menu-will-close', () => {
			// Delay on next tick, to allow to handle click event
			setTimeout(() => {
				onClick(null);
			}, 0);
		});

		return onClickPromise;
	});
};
