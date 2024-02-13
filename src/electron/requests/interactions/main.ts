import { shell } from 'electron';

import { ipcMainHandler } from '../../utils/ipc/electronMain';

import { interactionsChannel } from ".";

export const enableInteractions = () =>
	interactionsChannel.server(ipcMainHandler, {
		async openLink({ req: [url] }) {
			await shell.openExternal(url);
		},
	});
