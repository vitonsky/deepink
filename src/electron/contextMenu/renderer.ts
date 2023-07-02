import { ipcRenderer } from "electron";

import { ContextMenu, ipcChannelName } from ".";

export type ContextMenuRequestProps = {
	menu: ContextMenu;
	x: number;
	y: number;
}

export const openContextMenu = async ({ menu, x, y }: ContextMenuRequestProps): Promise<string | null> => {
	return ipcRenderer.invoke(ipcChannelName, { menu, x, y });
};