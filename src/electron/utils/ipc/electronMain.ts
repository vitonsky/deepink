import { ipcMain } from 'electron';

import { ServerRequestHandler } from '.';

export const ipcMainHandler: ServerRequestHandler<Electron.IpcMainInvokeEvent> = (
	endpoint,
	callback,
) => {
	const eventCallback = (evt: Electron.IpcMainInvokeEvent, args: any) => {
		return callback({ req: args, ctx: evt });
	};

	ipcMain.handle(endpoint, eventCallback);

	return () => {
		ipcMain.off(endpoint, eventCallback);
	};
};
