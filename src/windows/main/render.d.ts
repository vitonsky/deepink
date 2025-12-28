export interface ElectronAPI {
	confirm: (message?:string) => boolean;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}