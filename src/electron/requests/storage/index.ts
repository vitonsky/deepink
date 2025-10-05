import { createChannel } from '../../utils/ipc';

export type StorageChannelAPI = {
	upload: (id: string, buffer: ArrayBuffer, subdir: string) => Promise<void>;
	get: (id: string, subdir: string) => Promise<ArrayBuffer | null>;
	delete: (ids: string[], subdir: string) => Promise<void>;
	list: (subdir: string) => Promise<string[]>;
};

export const storageChannel = createChannel<StorageChannelAPI>({ name: 'storage' });
