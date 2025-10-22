import { saveAs } from 'file-saver';
import { selectDirectory } from '@electron/requests/files/renderer';

export const requestDirectoryPath = async () => {
	const directories = await selectDirectory();
	if (!directories || directories.length !== 1) {
		console.log('Must be selected one directory');
		return null;
	}

	return directories[0] || null;
};

export const saveFile = async (fileBuffer: ArrayBuffer, filename: string) => {
	saveAs(new Blob([fileBuffer]), filename);
};
