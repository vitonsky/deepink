import { subscribeIpcRendererEvent } from '../electronPatches/renderer';
import { LockState } from './ScreenLockWatcher';
import { SCREEN_LOCK_CHANNEL } from '.';

export const onLockScreenChanged = (callback: (state: LockState) => void) => {
	return subscribeIpcRendererEvent(
		SCREEN_LOCK_CHANNEL,
		(_event: Electron.IpcRendererEvent, state: LockState) => {
			callback(state);
		},
	);
};
