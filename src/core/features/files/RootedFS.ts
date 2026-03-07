import { getRootedPath, joinPathSegments, normalizePath } from '@utils/fs/paths';

import { OverlayFS } from './OverlayFS';
import { IFilesStorage } from '.';

export class RootedFS extends OverlayFS {
	private readonly root;
	constructor(storage: IFilesStorage, root: string) {
		super(storage);
		this.root = normalizePath(root);
	}

	private getHostPath(path: string) {
		return getRootedPath(joinPathSegments([this.root, path]), this.root);
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

		const rootSegmentsCount = this.root.split('/').length;
		return files
			.values()
			.map((path) => {
				const rootedPath = getRootedPath(path, this.root);
				return this.root === '/'
					? rootedPath
					: joinPathSegments(rootedPath.split('/').slice(rootSegmentsCount));
			})
			.filter((path) => path !== '/')
			.toArray();
	}
}
