import { useCallback } from 'react';

export type FilesInputOptions = {
	directory?: boolean;
	accept?: string;
	multiple?: boolean;
};

export const useFilesInput = () => {
	return useCallback(({ directory, accept, multiple }: FilesInputOptions = {}) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.webkitdirectory = directory ?? false;
		input.multiple = multiple ?? false;
		input.accept = accept ?? '';

		const filesPromise = new Promise<FileList | null>((resolve, reject) => {
			input.addEventListener(
				'error',
				(e) => {
					reject(new Error(e.message));
				},
				{ once: true },
			);

			input.addEventListener(
				'change',
				async (e: Event) => {
					const { files } = e.target as HTMLInputElement;

					resolve(files);
				},
				{ once: true },
			);

			input.addEventListener('cancel', () => resolve(null), { once: true });
		});

		input.click();

		return filesPromise;
	}, []);
};
