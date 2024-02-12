import { createChannel } from '../utils/ipc';
import { ContextMenuRequestProps } from './renderer';

export const ipcChannelName = 'context-menu';

export type ContextMenu = Electron.MenuItemConstructorOptions[];

export const contextMenuChannel = createChannel<{
	open: ({ menu, x, y }: ContextMenuRequestProps) => Promise<string | null>;
}>({ name: 'contextMenu' });
