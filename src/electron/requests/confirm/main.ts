import { BrowserWindow, dialog } from 'electron';
import { ipcMainHandler } from '@electron/utils/ipc/ipcMainHandler';

import { dialogChannel } from '.';

export const enableConfirmDialog = () => {
	dialogChannel.server(ipcMainHandler, {
		async open({ ctx: event, req: [message] }) {
			const window = BrowserWindow.fromWebContents(event.sender);
			if (!window) return;

			const result = await dialog.showMessageBox(window, {
				type: 'none',
				buttons: ['OK', 'Cancel'],
				defaultId: 0,
				cancelId: 1,
				message,
			});
			return result.response === 0;
		},
	});
};
