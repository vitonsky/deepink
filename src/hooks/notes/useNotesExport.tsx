import { useCallback, useState } from 'react';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { dumpFilesStorage } from '@core/features/files/utils/dumpFilesStorage';
import { NoteId } from '@core/features/notes';
import {
	ExportProgress,
	NoteExportData,
	NotesExporter,
} from '@core/storage/interop/export';
import {
	useFilesRegistry,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { requestDirectoryPath } from '@utils/fs/client';
import { escapeFileName, getResolvedPath } from '@utils/fs/paths';
import { uniqueName } from '@utils/fs/uniqueName';

/**
 * Build file name from parts and add timestamp at end
 */
export const buildFileName = (...parts: (string | undefined)[]) =>
	[...parts, `${Date.now()}`].filter(Boolean).join('-');

export const configureNoteNameGetter = (isSingleNoteMode = false) =>
	uniqueName(function noteFilename(note: NoteExportData, uniqueId) {
		let noteTag: string | null = null;
		if (!isSingleNoteMode) {
			for (const tag of note.tags) {
				// Use any tag if nothing selected
				if (!noteTag) {
					noteTag = tag;
					continue;
				}

				// Select tag with greatest segments number
				if (tag.split('/').length > noteTag.split('/').length) {
					noteTag = tag;
					continue;
				}
			}
		}

		return getResolvedPath(
			[
				...(isSingleNoteMode ? [] : [noteTag]),
				escapeFileName(
					[note.content.title.trim() || note.id, uniqueId]
						.filter(Boolean)
						.join('-') + '.md',
				),
			]
				.filter(Boolean)
				.join('/'),
			'/',
		);
	});

// TODO: notify for successful export
export const useNotesExport = () => {
	const [status, setStatus] = useState<{
		status: 'noteExport' | 'notesExport';
		progress?: {
			total: number;
			processed: number;
		};
	} | null>(null);

	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();
	const filesRegistry = useFilesRegistry();

	const exportNotes = useCallback(
		async (saveAsZip: boolean, name?: string) => {
			if (status) {
				console.warn(
					'Reject exporting request, because another export process in run',
				);
				return;
			}

			const directory = await requestDirectoryPath();
			if (!directory) return;

			setStatus({
				status: 'notesExport',
				progress: {
					total: 0,
					processed: 0,
				},
			});

			// Export
			const files = new InMemoryFS();
			await new NotesExporter(
				{
					filesRegistry,
					notesRegistry,
					tagsRegistry,
				},
				{
					noteFilename: configureNoteNameGetter(false),
				},
			).exportNotes(files, {
				onProcessed: (info: ExportProgress) => {
					setStatus({
						status: 'notesExport',
						progress: info,
					});
				},
			});

			setStatus(null);

			// Save
			await dumpFilesStorage(files, directory, {
				zip: saveAsZip,
				name,
			});
		},
		[filesRegistry, notesRegistry, status, tagsRegistry],
	);

	const exportNote = useCallback(
		async (noteId: NoteId, saveAsZip: boolean, name?: string) => {
			if (status) {
				console.warn(
					'Reject exporting request, because another export process in run',
				);
				return;
			}

			const directory = await requestDirectoryPath();
			if (!directory) return;

			setStatus({
				status: 'noteExport',
			});

			// Export
			const files = new InMemoryFS();
			await new NotesExporter(
				{
					filesRegistry,
					notesRegistry,
					tagsRegistry,
				},
				{
					noteFilename: configureNoteNameGetter(true),
				},
			).exportNote(noteId, files);

			setStatus(null);

			// Save
			await dumpFilesStorage(files, directory, {
				zip: saveAsZip,
				name,
			});
		},
		[filesRegistry, notesRegistry, status, tagsRegistry],
	);

	return {
		exportNotes,
		exportNote,
		isPending: status !== null,
		progress: status?.progress ?? null,
	} as const;
};
