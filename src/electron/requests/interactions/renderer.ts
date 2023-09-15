import { ipcRenderer } from 'electron';

import { CHANNELS } from '.';

export function openLink(url: string): Promise<void> {
	return ipcRenderer.invoke(CHANNELS.openLink, { url });
}
