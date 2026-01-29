import { ELECTRON_PATCHES_API } from './shared';

export const patchWindow = () => {
	// Patch confirm: original window.confirm causes focus loss
	window.confirm = (message?: string) =>
		(window as any)[ELECTRON_PATCHES_API].confirm(message);
};
