import { getFonts2 } from 'font-list';
import { AppContext } from '@electron/main/main';

import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { interopChannel } from '.';

export const serveInterop = ({ i18n }: AppContext) =>
	interopChannel.server(ipcMainHandler, {
		async getFontsList() {
			return getFonts2();
		},
		async getAppLanguage() {
			return i18n.$language.getState();
		},
		async setAppLanguage({ req: [language] }) {
			await i18n.changeLanguage(language);
		},
	});
