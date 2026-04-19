import { IFileController } from '@core/features/files';

export const createFileControllerMock = (): IFileController => {
	let file: ArrayBuffer | null = null;
	return {
		async get() {
			return file;
		},
		async write(buffer: ArrayBuffer) {
			file = buffer;
		},
		async delete() {
			file = null;
		},
	};
};
