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

	getVersion() {
		return '0.0.1';
	},
	getPreferredSystemLanguages() {
		return ['en', 'de'];
	},
	isAccessibilitySupportEnabled() {
		return false;
	},
} as (typeof electron)['app'];

export const nativeTheme = {
	shouldUseHighContrastColors: false,
	shouldUseDarkColors: false,
};

export const powerMonitor = {
	isOnBatteryPower() {
		return false;
	},
};

export const screen = {
	getPrimaryDisplay() {
		const size = { width: 1920, height: 1080 };

		return {
			size,
			workArea: size,
			displayFrequency: 60,
			scaleFactor: 1,
		};
	},
};

export const session = {
	defaultSession: {
		getUserAgent() {
			return 'Fake user agent';
		},
	},
};
