import { BrowserWindow, dialog, ipcMain } from 'electron';

import { CONFIRM_CHANNEL } from './shared';

export const enableElectronPatches = () => {
	// Patch confirm: original window.confirm causes focus loss; showMessageBoxSync keeps it modal
	ipcMain.on(CONFIRM_CHANNEL, (event, message?: string) => {
		const targetWindow = BrowserWindow.fromWebContents(event.sender);
		if (!targetWindow) return;

		const result = dialog.showMessageBoxSync(targetWindow, {
			type: 'none',
			buttons: ['OK', 'Cancel'],
			defaultId: 0,
			cancelId: 1,
			message: message ?? '',
		});
		event.returnValue = result === 0;
	});
};
