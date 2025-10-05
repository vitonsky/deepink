import { useCallback, useState } from 'react';
import { throttle } from 'lodash';
import { WorkspaceEvents } from '@api/events/workspace';
import { IFilesStorage } from '@core/features/files';
import {
	NotesImporter,
	NotesImporterOptions,
	OnProcessedPayload,
} from '@core/storage/interop/import';
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
	const [importSession, setImportSession] = useState<{
		abortController: AbortController;
		progress: OnProcessedPayload;
	} | null>(null);

	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();
	const filesRegistry = useFilesRegistry();
	const attachmentsRegistry = useAttachmentsController();
	const noteVersions = useNotesHistory();

	const eventBus = useEventBus();
	const importNotes = useCallback(
		async (files: IFilesStorage, options: NotesImporterOptions = {}) => {
			const abortController = new AbortController();

			setImportSession({
				abortController,
				progress: {
					stage: 'parsing',
					total: 0,
					processed: 0,
				},
			});

			const onProgress = throttle(setImportSession, 200);
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
					throttle: requestAnimationFrame,
					...options,
				},
			).import(files, {
				abortSignal: abortController.signal,
				onProcessed(info) {
					console.log('Import progress', info);
					onProgress((value) => (value ? { ...value, progress: info } : value));
				},
			});

			onProgress.flush();
			setImportSession(null);
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

	// TODO: return promise that will be resolved once import session is ended
	const abortController = importSession?.abortController;
	const abort = useCallback(
		(reason?: any) => {
			if (!abortController) return;
			abortController.abort(reason ?? new Error('Import is aborted by user'));
		},
		[abortController],
	);

	return {
		importNotes,
		progress: importSession?.progress ?? null,
		abort,
	} as const;
};
