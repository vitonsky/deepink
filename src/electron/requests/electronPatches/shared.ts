export const CONFIRM_CHANNEL = 'showConfirmDialog';

export const ELECTRON_PATCHES_API = 'electronPatches';

export type ElectronPatches = {
	confirm: (message?: string) => any;
	ipcRendererProxy: IpcRendererProxyAPI;
};

export type IpcRendererEventHandler = (
	event: Electron.IpcRendererEvent,
	...args: any[]
) => void;

export interface IpcRendererProxyAPI {
	on(channel: string, listener: IpcRendererEventHandler): number;
	off(channel: string, listenerId: number): void;
}
