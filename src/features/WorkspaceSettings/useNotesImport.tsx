import { useCallback, useState } from 'react';
import { debounce } from 'lodash';
import { WorkspaceEvents } from '@api/events/workspace';
import { IFilesStorage } from '@core/features/files';
import { NotesImporter, OnProcessedPayload } from '@core/storage/interop/import';
import {
	useAttachmentsController,
	useEventBus,
	useFilesRegistry,
	useNotesHistory,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';

// TODO: notify for successful import
export const useNotesImport = () => {
	const [progress, setProgress] = useState<OnProcessedPayload | null>(null);

	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();
	const filesRegistry = useFilesRegistry();
	const attachmentsRegistry = useAttachmentsController();
	const noteVersions = useNotesHistory();

	const eventBus = useEventBus();
	const importNotes = useCallback(
		async (files: IFilesStorage) => {
			setProgress({
				stage: 'parsing',
				total: 0,
				processed: 0,
			});

			const debouncedProgressUpdate = debounce(setProgress, 50);
			await new NotesImporter(
				{
					filesRegistry,
					notesRegistry,
					noteVersions,
					attachmentsRegistry,
					tagsRegistry,
				},
				{
					ignorePaths: ['/_resources'],
					// eslint-disable-next-line spellcheck/spell-checker
					noteExtensions: ['.md', '.mdx'],
					convertPathToTag: 'always',
				},
			).import(files, {
				onProcessed(info) {
					console.log(info);
					debouncedProgressUpdate(info);
				},
			});

			debouncedProgressUpdate(null);
			eventBus.emit(WorkspaceEvents.NOTES_UPDATED);
		},
		[
			attachmentsRegistry,
			eventBus,
			filesRegistry,
			noteVersions,
			notesRegistry,
			tagsRegistry,
		],
	);

	return {
		importNotes,
		progress,
	} as const;
};
