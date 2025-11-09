import { useCallback } from 'react';
import { FlateErrorCode } from 'fflate';
import { FilesFS } from '@core/features/files/FilesFS';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { ZipFS } from '@core/features/files/ZipFS';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { telemetry } from '@electron/requests/telemetry/renderer';
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
			const startTime = Date.now();

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
					const fs = new FilesFS(
						Object.fromEntries(
							files.map((file) => {
								let filePath = file.name;

								const relativePath: string =
									(file as any).relativePath ?? '';
								if (file.webkitRelativePath) {
									const relativePath =
										file.webkitRelativePath.split('/');
									filePath = joinPathSegments(
										relativePath.length > 1
											? relativePath.slice(1)
											: relativePath,
									);
								} else if (relativePath) {
									// Handle case if files was dropped and have no `webkitRelativePath` property, but have non standard `relativePath` property
									// https://github.com/react-dropzone/react-dropzone/issues/459
									// Remove first empty segment (root)
									const segments = relativePath
										.split('/')
										.filter(Boolean);
									filePath = joinPathSegments(
										segments.length > 1
											? segments.slice(1)
											: segments,
									);
								}

								return [filePath, file];
							}),
						),
					);

					await notesImport.importNotes(fs, {
						noteExtensions: ['.md', '.mdx'],
						convertPathToTag: 'always',
					});
					break;
				}
			}

			await telemetry.track(TELEMETRY_EVENT_NAME.IMPORT_NOTES, {
				type,
				filesCount: files.length,
				processingTime: Math.floor(Date.now() - startTime),
			});
		},
		[notesImport],
	);

	return {
		importFiles,
		progress: notesImport.progress,
		abort: notesImport.abort,
	};
};
