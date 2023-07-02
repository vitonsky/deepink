import { ipcRenderer } from "electron";

import { ipcChannelName } from ".";

export type ContextMenuRequestProps = {
	menuId: string;
	x: number;
	y: number;
}

export const openContextMenu = async ({ menuId, x, y }: ContextMenuRequestProps): Promise<string | null> => {
	return ipcRenderer.invoke(ipcChannelName, { menuId, x, y });
};