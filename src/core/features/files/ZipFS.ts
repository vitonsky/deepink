import { AsyncZipOptions, unzip, zip } from 'fflate';

import { InMemoryFS } from './InMemoryFS';

export class ZipFS extends InMemoryFS {
	async dump(options?: AsyncZipOptions) {
		const filesMap: Record<string, Uint8Array> = {};
		for (const [path, content] of Object.entries(this.storage)) {
			filesMap[path] = new Uint8Array(content);
		}

		return new Promise<ArrayBuffer>((resolve, reject) => {
			zip(filesMap, { ...options }, (error, data) => {
				if (error) {
					reject(error);
					return;
				}

				resolve(data.buffer);
			});
		});
	}

	async load(buffer: ArrayBuffer) {
		return new Promise<void>((resolve, reject) => {
			unzip(new Uint8Array(buffer), {}, (error, files) => {
				if (error) {
					reject(error);
					return;
				}

				for (const [path, content] of Object.entries(files)) {
					this.storage[path] = content.buffer;
				}

				resolve();
			});
		});
	}
}
