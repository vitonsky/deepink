import { selectDirectory } from '@electron/requests/files/renderer';
import { getPathSegments } from '@utils/fs/paths';

import { mkdir, writeFile } from 'fs/promises';

export const requestDirectoryPath = async () => {
	const directories = await selectDirectory();
	if (!directories || directories.length !== 1) {
		console.log('Must be selected one directory');
		return null;
	}

	return directories[0] || null;
};

export const saveFile = async (fullPath: string, fileBuffer: ArrayBuffer) => {
	console.log('Write file to', fullPath);

	// TODO: remove node usages in frontend code
	await mkdir(getPathSegments(fullPath).dirname, { recursive: true });

	await writeFile(fullPath, Buffer.from(fileBuffer));
};
