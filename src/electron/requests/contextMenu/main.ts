import { BrowserWindow, Menu } from 'electron';

import { ipcMainHandler } from '../../utils/ipc/electronMain';

import { contextMenuChannel } from '.';

export const enableContextMenu = () =>
	contextMenuChannel.server(ipcMainHandler, {
		async open({ req: [props], ctx: event }) {
			const targetWindow = BrowserWindow.fromWebContents(event.sender);
			if (!targetWindow) return;

			const { menu: menuTemplate, x = 0, y = 0 } = props ?? {};

			// Handle click on menu
			let onClick: (itemId: string | null) => void;
			const onClickPromise = new Promise<string | null>((res) => {
				onClick = res;
			});

			const prepareMenu = (menu: Electron.MenuItemConstructorOptions[]) => {
				return menu.map(({ id, click, ...props }) => {
					// Decorate click handler, to resolve promise with menu id by click on menu
					const clickHandler =
						id === undefined
							? click
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

			const menu = Menu.buildFromTemplate(prepareMenu(menuTemplate));

			menu.popup({ window: targetWindow, x, y });
			menu.once('menu-will-close', () => {
				// Delay on next tick, to allow to handle click event
				setTimeout(() => {
					onClick(null);
				}, 0);
			});

			return onClickPromise;
		},
	});
