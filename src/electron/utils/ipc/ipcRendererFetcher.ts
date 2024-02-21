import { ipcRenderer } from 'electron';

export const ipcRendererFetcher = (channelName: string, args: any[]) =>
	ipcRenderer.invoke(channelName, args);
