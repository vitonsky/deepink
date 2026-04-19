import { IFilesStorage } from '@core/features/files';
import { getPathSegments, getResolvedPath } from '@utils/fs/paths';

// TODO: cover all implementations with tests

/**
 * The purpose of this FS is a lazy loading for buffers from a files list
 *
 * Instead of read file buffers and insert into FS, this FS operates with Files under the hood
 */
export class FilesFS implements IFilesStorage {
	protected readonly storage: Record<string, File>;
	constructor(files?: Record<string, File>) {
		this.storage = {};

		// Init storage
		if (files) {
			for (const [path, file] of Object.entries(files)) {
				this.storage[getResolvedPath(path, '/')] = file;
			}
		}
	}

	async write(path: string, buffer: ArrayBuffer) {
		this.storage[getResolvedPath(path, '/')] = new File(
			[buffer],
			getPathSegments(path).basename,
		);
	}

	async get(path: string) {
		const file = this.storage[getResolvedPath(path, '/')];

		return file ? file.arrayBuffer() : null;
	}
	async delete(paths: string[]) {
		paths.forEach((path) => {
			delete this.storage[getResolvedPath(path, '/')];
		});
	}
	async list() {
		return Object.keys(this.storage);
	}
}
