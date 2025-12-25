import { createChannel } from '../../utils/ipc';

export const dialogChannel = createChannel<{
	open: (message: string) => Promise<boolean>;
}>({ name: 'confirmDialog' });
