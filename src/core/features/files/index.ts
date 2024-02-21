/**
 * Interface for persistent files storage
 * File name is UUID, not a file system path
 *
 * For desktop app it may be FS or cloud service, for web it may be API or indexedDB
 */
export type IFilesStorage = {
	write: (uuid: string, buffer: ArrayBuffer) => Promise<void>;
	get: (uuid: string) => Promise<ArrayBuffer | null>;
	delete: (uuid: string[]) => Promise<void>;
	list: () => Promise<string[]>;
};
