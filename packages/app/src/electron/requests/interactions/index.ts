import { createChannel } from '../../utils/ipc';

export const interactionsChannel = createChannel<{
	openLink: (url: string) => Promise<void>;
}>({ name: 'interactions' });
