import { ipcRendererFetcher } from '../../utils/ipc/ipcRendererFetcher';

import { dialogChannel } from '.';

export const { open: confirmDialog } = dialogChannel.client(ipcRendererFetcher);
