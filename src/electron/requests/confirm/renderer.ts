import { ipcRendererFetcher } from '../../utils/ipc/ipcRendererFetcher';

import { dialogChannel } from '.';

export const { open: showConfirmDialog } = dialogChannel.client(ipcRendererFetcher);
