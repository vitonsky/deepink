import { IFilesStorage } from '@core/features/files';
import { ZipFS } from '@core/features/files/ZipFS';
import { saveFile } from '@utils/fs/client';
import { escapeFileName, joinPathSegments } from '@utils/fs/paths';

export const dumpFilesStorage = async (
	fs: IFilesStorage,
	directory: string,
	{ zip, name }: { zip?: boolean; name?: string } = {},
) => {
	if (zip) {
		const zipBuffer = await new ZipFS(fs).dump();
		await saveFile(
			joinPathSegments([
				directory,
				escapeFileName(String(name ?? Date.now())) + '.zip',
			]),
			zipBuffer,
		);
	} else {
		for (const filePath of await fs.list()) {
			const fileBuffer = await fs.get(filePath);
			if (!fileBuffer) continue;

			const fullPath = joinPathSegments([directory, filePath]);

			await saveFile(fullPath, fileBuffer);
		}
	}
};
