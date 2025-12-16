import { BrowserWindow, dialog } from 'electron';
import { ipcMainHandler } from '@electron/utils/ipc/ipcMainHandler';

import { dialogChannel } from '.';

export const enableConfirmDialog = () => {
	dialogChannel.server(ipcMainHandler, {
		async open({ ctx: evt, req: [props] }) {
			const window = BrowserWindow.getAllWindows().find(
				(win) => win.webContents.id === evt.sender.id,
			);
			if (!window) return;

			const result = await dialog.showMessageBox(window, {
				type: 'none',
				buttons: ['OK', 'Cancel'],
				defaultId: 0,
				cancelId: 1,
				message: props,
			});
			return result.response === 0;
		},
	});
};
