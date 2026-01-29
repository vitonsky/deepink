import { getZoomFactor } from '@utils/os/zoom';

import { ipcRendererFetcher } from '../../utils/ipc/ipcRendererFetcher';

import { ContextMenu, contextMenuChannel } from '.';

export type ContextMenuRequestProps = {
	menu: ContextMenu;
	x: number;
	y: number;
};

export const { open: openContextMenu } = contextMenuChannel.client(ipcRendererFetcher);

export const getContextMenuCoords = (event: MouseEvent) => ({
	x: Math.ceil(event.pageX * getZoomFactor()),
	y: Math.ceil(event.pageY * getZoomFactor()),
});
