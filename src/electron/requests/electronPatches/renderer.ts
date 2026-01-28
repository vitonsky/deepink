import { ELECTRON_PATCHES_API } from './shared';

// Patch confirm: original window.confirm causes focus loss
export const patchWindow = () => {
	window.confirm = (message?: string) =>
		(window as any)[ELECTRON_PATCHES_API].confirm(message);
};
