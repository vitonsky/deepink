import { ipcRendererFetcher } from '../../utils/ipc/ipcRendererFetcher';

import { interactionsChannel } from '.';

export const { openLink } = interactionsChannel.client(ipcRendererFetcher);
