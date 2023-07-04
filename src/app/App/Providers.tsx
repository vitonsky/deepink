import React, { createContext, FC, useContext } from 'react';

export type FileId = string;

/**
 * Upload file and return file ID
 */
export type FileUploader = (buffer: ArrayBuffer) => Promise<FileId>;
export const fileUploaderContext = createContext<FileUploader>(null as any);
export const useFileUploader = () => {
	return useContext(fileUploaderContext);
};

/**
 * Get file by id
 *
 * Return file buffer or null if file not found
 */
export type FileGetter = (fileId: FileId) => Promise<ArrayBuffer | null>;
export const fileGetterContext = createContext<FileGetter>(null as any);
export const useFileGetter = () => {
	return useContext(fileGetterContext);
};

type ProvidersProps = {
	children: React.ReactNode;
	fileUploader: FileUploader;
	fileGetter: FileGetter;
};

export const Providers: FC<ProvidersProps> = ({ children, fileUploader, fileGetter }) => {
	return (
		<fileUploaderContext.Provider value={fileUploader}>
			<fileGetterContext.Provider value={fileGetter}>
				{children}
			</fileGetterContext.Provider>
		</fileUploaderContext.Provider>
	);
};
