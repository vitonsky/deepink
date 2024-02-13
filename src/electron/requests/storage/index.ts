import { createChannel } from '../../utils/ipc';

export const storageChannel = createChannel<{
	upload: (id: string, buffer: ArrayBuffer, subdir: string) => Promise<void>;
	get: (id: string, subdir: string) => Promise<ArrayBuffer | null>;
	delete: (ids: string[], subdir: string) => Promise<void>;
	list: (subdir: string) => Promise<string[]>;
}>({ name: 'storage' });
