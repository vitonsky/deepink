import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { getResolvedPath, joinPathSegments } from '@utils/fs/paths';

import { ElectronFilesController } from './renderer';
import { StorageChannelAPI } from '.';

class StorageChannel implements StorageChannelAPI {
	constructor(private readonly storage: InMemoryFS) {}
	public async upload(path: string, buffer: ArrayBuffer, subdir: string) {
		return this.storage.write(joinPathSegments([subdir, path]), buffer);
	}

	public async list(subdir: string): Promise<string[]> {
		const filesList = await this.storage.list();

		const prefixLength = getResolvedPath(subdir, '/').length;
		return filesList.map((path) => path.slice(prefixLength));
	}

	public get = (path: string, subdir: string) =>
		this.storage.get(joinPathSegments([subdir, path]));
	public delete = (paths: string[], subdir: string) =>
		this.storage.delete(paths.map((path) => joinPathSegments([subdir, path])));
}

describe('Basic cases', () => {
	const storage = new StorageChannel(new InMemoryFS());

	const subdirectory = 'home/username/subdirectory';
	const files = new ElectronFilesController(storage, subdirectory);

	describe('Uploading tests', () => {
		const uploadSpy = vi.spyOn(storage, 'upload');
		afterAll(() => {
			uploadSpy.mockReset();
		});

		test('Files may be uploaded with any paths', async () => {
			// Files may be uploaded with any paths
			// They must be uploaded under root directory
			await expect(files.write('file1', new ArrayBuffer(1))).resolves.not.toThrow();
			await expect(
				files.write('/file2', new ArrayBuffer(1)),
			).resolves.not.toThrow();
			await expect(
				files.write('../../../../file3', new ArrayBuffer(1)),
			).resolves.not.toThrow();
			await expect(
				files.write('dir1/dir2/file1', new ArrayBuffer(1)),
			).resolves.not.toThrow();
			await expect(
				files.write('/dir1/dir2/file2', new ArrayBuffer(1)),
			).resolves.not.toThrow();
			await expect(
				files.write('/dir1/dir2/../file3', new ArrayBuffer(1)),
			).resolves.not.toThrow();
		});

		test('Files must be listed and available with absolute paths', async () => {
			const filesList = await files.list();
			expect(filesList).toEqual([
				`/file1`,
				`/file2`,
				`/file3`,
				`/dir1/dir2/file1`,
				`/dir1/dir2/file2`,
				`/dir1/file3`,
			]);

			await expect(files.get('/non/exists/file')).resolves.not.toEqual(
				expect.any(ArrayBuffer),
			);
			await expect(
				Promise.all(filesList.map((path) => files.get(path))),
			).resolves.toEqual(filesList.map(() => expect.any(ArrayBuffer)));
		});

		test('Real FS must be called to upload files via relative paths + sub directory', async () => {
			expect(uploadSpy.mock.calls).toEqual([
				['file1', expect.any(ArrayBuffer), subdirectory],
				['file2', expect.any(ArrayBuffer), subdirectory],
				['file3', expect.any(ArrayBuffer), subdirectory],
				['dir1/dir2/file1', expect.any(ArrayBuffer), subdirectory],
				['dir1/dir2/file2', expect.any(ArrayBuffer), subdirectory],
				['dir1/file3', expect.any(ArrayBuffer), subdirectory],
			]);
		});
	});
});
