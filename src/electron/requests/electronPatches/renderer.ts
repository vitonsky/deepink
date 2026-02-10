import { ELECTRON_PATCHES_API, ElectronPatches, IpcRendererEventHandler } from './shared';

const api = (window as any)[ELECTRON_PATCHES_API] as ElectronPatches;

export const patchWindow = () => {
	// Patch confirm: original window.confirm causes focus loss
	window.confirm = (message?: string) =>
		(window as any)[ELECTRON_PATCHES_API].confirm(message);
};

export const subscribeIpcRendererEvent = (
	eventName: string,
	callback: IpcRendererEventHandler,
) => {
	const id = api.ipcRendererProxy.on(eventName, callback);
	return () => {
		api.ipcRendererProxy.off(eventName, id);
	};
};
