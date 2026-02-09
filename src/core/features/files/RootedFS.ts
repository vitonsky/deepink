import { getResolvedPath } from '@utils/fs/paths';

import { OverlayFS } from './OverlayFS';
import { IFilesStorage } from '.';

export class RootedFS extends OverlayFS {
	constructor(
		storage: IFilesStorage,
		private readonly root: string,
	) {
		super(storage);
	}

	private getHostPath(path: string) {
		return getResolvedPath(path, this.root);
	}

	write(path: string, buffer: ArrayBuffer): Promise<void> {
		return super.write(this.getHostPath(path), buffer);
	}

	get(path: string): Promise<ArrayBuffer | null> {
		return super.get(this.getHostPath(path));
	}

	delete(paths: string[]): Promise<void> {
		return super.delete(paths.map((path) => this.getHostPath(path)));
	}

	async list(): Promise<string[]> {
		const files = await super.list();
		return files
			.values()
			.filter((path) => path.startsWith(this.root))
			.map((path) => path.slice(this.root.length))
			.toArray();
	}
}
