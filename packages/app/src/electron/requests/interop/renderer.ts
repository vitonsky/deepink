import { ipcRendererFetcher } from '../../utils/ipc/ipcRendererFetcher';

import { interopChannel } from '.';

export const { getFontsList } = interopChannel.client(ipcRendererFetcher);
