import { useCallback } from 'react';

import { useFilesInput } from './useFilesInput';

export const useDirectoryPicker = () => {
	const pickFiles = useFilesInput();

	return useCallback(
		async () => pickFiles({ directory: true, multiple: true }),
		[pickFiles],
	);
};
