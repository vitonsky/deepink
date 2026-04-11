import { openUrlWithExternalBrowser } from '@electron/utils/shell';

import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { interactionsChannel } from '.';

export const enableInteractions = () =>
	interactionsChannel.server(ipcMainHandler, {
		async openLink({ req: [url] }) {
			await openUrlWithExternalBrowser(url);
		},
	});
