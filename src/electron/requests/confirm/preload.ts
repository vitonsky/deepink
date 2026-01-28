import { contextBridge, ipcRenderer } from 'electron';

import { CONFIRM_CHANNEL, CONFIRM_CHANNEL_API } from './shared';

export const exposeConfirm = () => {
	contextBridge.exposeInMainWorld(CONFIRM_CHANNEL_API, (message?: string) =>
		ipcRenderer.sendSync(CONFIRM_CHANNEL, message),
	);
};
