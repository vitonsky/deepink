import { useCallback } from 'react';
import { FlateErrorCode } from 'fflate';
import { FilesFS } from '@core/features/files/FilesFS';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { ZipFS } from '@core/features/files/ZipFS';
import { joinPathSegments } from '@utils/fs/paths';

import { useNotesImport } from './useNotesImport';

export const importOptions = [
	{ type: 'zip', text: 'Import notes from .zip archive' },
	{ type: 'directory', text: 'Import directory with Markdown files' },
] as const;

export type ImportTypes = (typeof importOptions)[number]['type'];

export const useImportNotesPreset = () => {
	const notesImport = useNotesImport();

	const importFiles = useCallback(
		async (type: ImportTypes, files: File[]) => {
			// NotesImporterOptions
			switch (type) {
				case 'zip': {
					try {
						const fs = new ZipFS(new InMemoryFS());

						const zipBuffer = await files[0].arrayBuffer();
						await fs.load(zipBuffer);

						await notesImport.importNotes(fs, {
							noteExtensions: ['.md', '.mdx'],
							convertPathToTag: 'always',
						});
					} catch (error) {
						if (typeof error === 'object' && error && 'code' in error) {
							switch (error.code) {
								case FlateErrorCode.InvalidZipData:
									console.log('Invalid archive data');
									break;
							}
						}

						throw error;
					}

					break;
				}
				case 'directory': {
					await notesImport.importNotes(
						new FilesFS(
							Object.fromEntries(
								files.map((file) => {
									let filePath = file.name;
									if (file.webkitRelativePath) {
										const relativePath = file.webkitRelativePath.split('/');
										filePath = joinPathSegments(
											relativePath.length > 1
												? relativePath.slice(1)
												: relativePath
										);
									}

									return [filePath, file];
								})
							)
						),
						{
							noteExtensions: ['.md', '.mdx'],
							convertPathToTag: 'always',
						}
					);
					break;
				}
			}
		},
		[notesImport]
	);

	return {
		importFiles,
		progress: notesImport.progress,
	};
};
