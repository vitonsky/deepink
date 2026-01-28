import { BrowserWindow, dialog, ipcMain } from 'electron';

// Patch confirm: original window.confirm causes focus loss; showMessageBoxSync keeps it modal
export const enableConfirm = () => {
	ipcMain.on('showConfirm', (event, message?: string) => {
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
