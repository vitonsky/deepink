import { IFilesStorage } from '../..';

export const createFileManagerMock = (
	initData?: Record<string, ArrayBuffer>,
): IFilesStorage => {
	const storage: Record<string, ArrayBuffer> = { ...initData };
	return {
		async write(uuid, buffer) {
			storage[uuid] = buffer;
		},
		async get(uuid) {
			return storage[uuid];
		},
		async delete(uuids) {
			uuids.forEach((uuid) => {
				delete storage[uuid];
			});
		},
		async list() {
			return Object.keys(storage);
		},
	};
};
