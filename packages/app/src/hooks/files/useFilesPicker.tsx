import { useCallback } from 'react';

import { FilesInputOptions, useFilesInput } from './useFilesInput';

export const useFilesPicker = () => {
	const pickFiles = useFilesInput();

	return useCallback(
		async (options: Omit<FilesInputOptions, 'directory'> = {}) =>
			pickFiles({ ...options, directory: false }),
		[pickFiles],
	);
};
