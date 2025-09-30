import { unzipSync, ZipOptions, zipSync } from 'fflate';

import { OverlayFS } from './OverlayFS';

export class ZipFS extends OverlayFS {
	async dump(options?: ZipOptions) {
		const filesMap: Record<string, Uint8Array> = {};
		for (const path of await this.list()) {
			const buffer = await this.get(path);
			if (!buffer) continue;

			filesMap[path] = new Uint8Array(buffer);
		}

		return zipSync(filesMap, { ...options }).buffer;
	}

	async load(buffer: ArrayBuffer) {
		const files = unzipSync(new Uint8Array(buffer));
		for (const [path, content] of Object.entries(files)) {
			await this.write(path, content.buffer);
		}
	}
}
