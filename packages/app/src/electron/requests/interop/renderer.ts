import { ipcRendererFetcher } from '../../utils/ipc/ipcRendererFetcher';

import { interopChannel } from '.';

export const { getFontsList, getAppLanguage, setAppLanguage } =
	interopChannel.client(ipcRendererFetcher);
