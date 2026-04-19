import { BrowserWindow, dialog, ipcMain, IpcMainEvent } from 'electron';
import { I18nContext } from '@electron/main/I18nContext';

import { CONFIRM_CHANNEL } from './shared';

export const enableElectronPatches = ({ t }: I18nContext) => {
	const onMessage = (event: IpcMainEvent, message?: string) => {
		const targetWindow = BrowserWindow.fromWebContents(event.sender);
		if (!targetWindow) return;

		const result = dialog.showMessageBoxSync(targetWindow, {
			type: 'question',
			buttons: [
				t('actions.confirm', { ns: 'common' }),
				t('actions.cancel', { ns: 'common' }),
			],
			defaultId: 0,
			cancelId: 1,
			message: message ?? '',
		});
		event.returnValue = result === 0;
	};

	// Patch confirm: original window.confirm causes focus loss; showMessageBoxSync keeps it modal
	ipcMain.on(CONFIRM_CHANNEL, onMessage);

	return () => {
		ipcMain.off(CONFIRM_CHANNEL, onMessage);
	};
};
