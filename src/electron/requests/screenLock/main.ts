import { webContents } from 'electron';

import { ScreenLockWatcher } from './ScreenLockWatcher';
import { SCREEN_LOCK_CHANNEL } from '.';

export const enableScreenLockNotifications = () => {
	const lockWatcher = new ScreenLockWatcher((state) => {
		console.log('Lock status update:', state);

		for (const wc of webContents.getAllWebContents()) {
			wc.send(SCREEN_LOCK_CHANNEL, state);
		}
	});

	lockWatcher.start();

	return () => {
		lockWatcher.stop();
	};
};
