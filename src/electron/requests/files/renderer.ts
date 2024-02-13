import { ipcRenderer } from 'electron';

import { filesChannel } from '.';

export const { importNotes, selectDirectory, getUserDataPath, getResourcesPath } =
	filesChannel.client({
		async importNotes({ channelName }) {
			return ipcRenderer.invoke(channelName);
		},
		async selectDirectory({ channelName }) {
			return ipcRenderer.invoke(channelName);
		},
		async getUserDataPath({ channelName, args }) {
			return ipcRenderer.invoke(channelName, args);
		},
		async getResourcesPath({ channelName, args }) {
			return ipcRenderer.invoke(channelName, args);
		},
	});
