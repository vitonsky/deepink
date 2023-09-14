import { ipcMain, shell } from 'electron';

import { CHANNELS } from '.';

function uploadFile() {
	ipcMain.handle(CHANNELS.openLink, async (_evt, { url }) => {
		shell.openExternal(url);
	});
}

export const handleInteractionsRequests = [uploadFile] as const;
