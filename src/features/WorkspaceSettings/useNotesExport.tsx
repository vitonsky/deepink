import { useCallback, useState } from 'react';
import { IFilesStorage } from '@core/features/files';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { dumpFilesStorage } from '@core/features/files/utils/dumpFilesStorage';
import { ExportProgress, NotesExporter } from '@core/storage/interop/export';
import {
	useFilesRegistry,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { requestDirectoryPath } from '@utils/fs/client';

export const getExportArchiveName = (workspaceName?: string) =>
	[
		'backup',
		workspaceName ? `workspace_${workspaceName}` : undefined,
		`${Date.now()}.zip`,
	]
		.filter(Boolean)
		.join('-');

// TODO: notify for successful export
export const useNotesExport = () => {
	const [progress, setProgress] = useState<{
		total: number;
		processed: number;
	} | null>(null);

	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();
	const filesRegistry = useFilesRegistry();

	const dumpNotes = useCallback(
		async (exportTarget: IFilesStorage) => {
			setProgress({
				total: 0,
				processed: 0,
			});

			const exporter = new NotesExporter(
				{
					filesRegistry,
					notesRegistry,
					tagsRegistry,
				},
				{
					noteFilename(note) {
						return [
							'notes',
							note.tags[0],
							[note.id, note.content.title].filter(Boolean).join('-') +
								'.md',
						]
							.filter(Boolean)
							.join('/');
					},
				},
			);

			await exporter.exportNotes(exportTarget, {
				onProcessed: (info: ExportProgress) => {
					setProgress(info);
				},
			});

			setProgress(null);
		},
		[filesRegistry, notesRegistry, tagsRegistry],
	);

	const exportNotes = useCallback(
		async (saveAsZip: boolean, name?: string) => {
			const directory = await requestDirectoryPath();
			if (!directory) return;

			// Export
			const exportFs = new InMemoryFS();
			await dumpNotes(exportFs);

			// Save

			await dumpFilesStorage(exportFs, directory, {
				zip: saveAsZip,
				name,
			});
		},
		[dumpNotes],
	);

	return {
		exportNotes,
		progress,
	} as const;
};
