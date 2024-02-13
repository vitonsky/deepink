import { ipcRenderer } from 'electron';

import { interactionsChannel } from '.';

export const { openLink } = interactionsChannel.client({
	async openLink({ args, channelName }) {
		return ipcRenderer.invoke(channelName, args);
	},
});
