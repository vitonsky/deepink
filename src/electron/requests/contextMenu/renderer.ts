import { ipcRenderer } from 'electron';

import { ContextMenu, contextMenuChannel } from ".";

export type ContextMenuRequestProps = {
	menu: ContextMenu;
	x: number;
	y: number;
};

export const { open: openContextMenu } = contextMenuChannel.client({
	open({ channelName, args }) {
		return ipcRenderer.invoke(channelName, args);
	},
});
