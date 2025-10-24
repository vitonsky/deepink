import { existsSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { cwd } from 'process';
import recursive from 'recursive-readdir';
import { IFilesStorage } from '@core/features/files';
import { recoveryAtomicFile, writeFileAtomic } from '@utils/files';

import { mkdir, readFile, rm } from 'fs/promises';

// TODO: cover all implementations with tests
export class NodeFS implements IFilesStorage {
	constructor(private readonly options: { root?: string } = {}) {}

	private resolvePath(path: string) {
		const { root } = this.options;

		const resolvedRoot = resolve(root ?? cwd());
		const resolvedPath = resolve(join(resolvedRoot, path));

		console.log({ resolvedRoot, resolvedPath });
		if (!resolvedPath.startsWith(resolvedRoot))
			throw new Error('Path is out of root directory');

		return resolvedPath;
	}

	async write(path: string, buffer: ArrayBuffer) {
		const resolvedPath = this.resolvePath(path);

		await mkdir(dirname(resolvedPath), { recursive: true });
		await writeFileAtomic(resolvedPath, Buffer.from(new Uint8Array(buffer)));
	}

	async get(path: string) {
		const resolvedPath = this.resolvePath(path);

		recoveryAtomicFile(resolvedPath);

		if (!existsSync(resolvedPath) || !statSync(resolvedPath).isFile()) return null;

		const buffer = await readFile(resolvedPath);
		return new Uint8Array(buffer).buffer;
	}

	async delete(paths: string[]) {
		for (const path of paths) {
			const resolvedPath = this.resolvePath(path);

			if (!existsSync(resolvedPath)) {
				console.debug('Not found file', resolvedPath);
				continue;
			}

			await rm(resolvedPath, { force: true, recursive: true });
		}
	}
	async list() {
		const filesDir = this.resolvePath('/');

		if (!existsSync(filesDir)) return [];

		const files = await recursive(filesDir);
		return files.map((path) =>
			// Remove root path
			path.slice(filesDir.length),
		);
	}
}
