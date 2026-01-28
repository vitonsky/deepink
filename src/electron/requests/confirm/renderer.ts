export interface ElectronAPI {
	confirm: (message?: string) => boolean;
}

declare global {
	interface Window {
		electron: ElectronAPI;
	}
}

// Patch confirm: original window.confirm causes focus loss
export const patchWindowConfirm = () => {
	window.confirm = (message?: string) => window.electron.confirm(message);
};
