import { unzipSync, ZipOptions, zipSync } from 'fflate';

import { InMemoryFS } from './InMemoryFS';

export class ZipFS extends InMemoryFS {
	async dump(options?: ZipOptions) {
		const filesMap: Record<string, Uint8Array> = {};
		for (const [path, content] of Object.entries(this.storage)) {
			filesMap[path] = new Uint8Array(content);
		}

		return zipSync(filesMap, { ...options }).buffer;
	}

	async load(buffer: ArrayBuffer) {
		const files = unzipSync(new Uint8Array(buffer));
		for (const [path, content] of Object.entries(files)) {
			this.storage[path] = content.buffer;
		}
	}
}
