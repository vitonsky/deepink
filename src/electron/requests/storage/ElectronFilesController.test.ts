import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { joinPathSegments } from '@utils/fs/paths';

import { ElectronFilesController } from './renderer';
import { StorageChannelAPI } from '.';

class StorageChannel extends InMemoryFS implements StorageChannelAPI {
	public async upload(path: string, buffer: ArrayBuffer, subdir: string) {
		return this.write(joinPathSegments([subdir, path]), buffer);
	}
}

test('Basic cases', async () => {
	const storage = new StorageChannel();
	const uploadSpy = vi.spyOn(storage, 'upload');

	const subdirectory = 'subdirectory';
	const files = new ElectronFilesController(storage, subdirectory);

	await expect(files.write('file1', new ArrayBuffer(1))).resolves.not.toThrow();
	await expect(files.write('/file2', new ArrayBuffer(1))).resolves.not.toThrow();
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

	await expect(files.list()).resolves.toEqual([
		`/${subdirectory}/file1`,
		`/${subdirectory}/file2`,
		`/${subdirectory}/file3`,
		`/${subdirectory}/dir1/dir2/file1`,
		`/${subdirectory}/dir1/dir2/file2`,
		`/${subdirectory}/dir1/file3`,
	]);

	expect(uploadSpy.mock.calls).toEqual([
		['file1', expect.any(ArrayBuffer), subdirectory],
		['file2', expect.any(ArrayBuffer), subdirectory],
		['file3', expect.any(ArrayBuffer), subdirectory],
		['dir1/dir2/file1', expect.any(ArrayBuffer), subdirectory],
		['dir1/dir2/file2', expect.any(ArrayBuffer), subdirectory],
		['dir1/file3', expect.any(ArrayBuffer), subdirectory],
	]);
});
