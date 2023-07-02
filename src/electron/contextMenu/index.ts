
export const ipcChannelName = 'context-menu';

export type ContextMenu = {
	id: string,
	menu: Electron.MenuItemConstructorOptions[],
}