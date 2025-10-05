import type electron from 'electron';
import * as electronIPCMock from '@mocks/electron/__mocks__/ipc';

export const ipcMain = electronIPCMock.ipcMain;
export const ipcRenderer = electronIPCMock.ipcRenderer;

/**
 * Mock part of electron API used on project
 */
export const app = {
	// We run tests against production code
	isPackaged: true,
	getPath: ((name) => {
		switch (name) {
			case 'userData':
				return '/home/userData/appDir';
			default:
				throw new Error(`Not implemented case for "${name}"`);
		}
	}) satisfies (typeof app)['getPath'],
} as (typeof electron)['app'];
