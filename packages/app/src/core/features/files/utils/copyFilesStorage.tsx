import { IFilesStorage } from '@core/features/files';

// TODO: implement filter
/**
 * Copy all files from `source` FS to `target` FS and returns a `target`
 */
export const copyFilesStorage = async (source: IFilesStorage, target: IFilesStorage) => {
	for (const file of await source.list()) {
		const buffer = await source.get(file);
		if (!buffer) continue;

		await target.write(file, buffer);
	}

	return target;
};
