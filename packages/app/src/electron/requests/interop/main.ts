import { getFonts2 } from 'font-list';

import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { interopChannel } from '.';

export const serveInterop = () =>
	interopChannel.server(ipcMainHandler, {
		async getFontsList() {
			return getFonts2();
		},
	});
