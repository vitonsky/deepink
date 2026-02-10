import { ipcRenderer } from 'electron';

import { LockState } from './ScreenLockWatcher';
import { SCREEN_LOCK_CHANNEL } from '.';

export const onLockScreenChanged = (callback: (state: LockState) => void) => {
	const onMessage = (_event: Electron.IpcRendererEvent, state: LockState) => {
		callback(state);
	};

	ipcRenderer.on(SCREEN_LOCK_CHANNEL, onMessage);

	return () => {
		ipcRenderer.off(SCREEN_LOCK_CHANNEL, onMessage);
	};
};
