import { useCallback, useState } from 'react';
import { debounce } from 'lodash';
import { IFilesStorage } from '@core/features/files';
import { NotesExporter } from '@core/storage/interop/export';
import {
	useFilesRegistry,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';

// TODO: notify for successful export
export const useNotesExport = () => {
	const [progress, setProgress] = useState<{
		total: number;
		processed: number;
	} | null>(null);

	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();
	const filesRegistry = useFilesRegistry();

	const exportNotes = useCallback(
		async (exportTarget: IFilesStorage) => {
			setProgress({
				total: 0,
				processed: 0,
			});

			const debouncedProgressUpdate = debounce(setProgress, 50);
			await new NotesExporter(
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
			).exportNotes(exportTarget, {
				onProcessed(info) {
					console.log(info);
					debouncedProgressUpdate(info);
				},
			});

			debouncedProgressUpdate(null);
		},
		[filesRegistry, notesRegistry, tagsRegistry],
	);

	return {
		exportNotes,
		progress,
	} as const;
};
