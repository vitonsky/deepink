import { InMemoryFS } from '../../InMemoryFS';

import { IFilesStorage } from '../..';

export const createFileManagerMock = (
	initData?: Record<string, ArrayBuffer>,
): IFilesStorage => {
	return new InMemoryFS(initData);
};
