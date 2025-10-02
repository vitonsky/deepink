import { joinPathSegments } from '@utils/fs/paths';

import { IFilesStorage } from '..';

export const copyFileListToFS = async (files: FileList, fs: IFilesStorage) => {
	// Read files
	for (const file of Array.from(files)) {
		let filePath = file.name;
		if (file.webkitRelativePath) {
			const relativePath = file.webkitRelativePath.split('/');
			filePath = joinPathSegments(
				relativePath.length > 1 ? relativePath.slice(1) : relativePath,
			);
		}

		const buffer = await file.arrayBuffer();
		await fs.write(filePath, buffer);
	}

	return fs;
};
