import { IFilesStorage } from '@core/features/files';
import { ZipFS } from '@core/features/files/ZipFS';
import { saveFile } from '@utils/fs/client';
import { escapeFileName } from '@utils/fs/paths';

export const dumpFilesStorage = async (
	fs: IFilesStorage,
	{ name }: { name?: string } = {},
) => {
	const fileName = escapeFileName(String(name ?? Date.now())) + '.zip';
	const zipBuffer = await new ZipFS(fs).dump();
	await saveFile(zipBuffer as ArrayBuffer, fileName);
};
