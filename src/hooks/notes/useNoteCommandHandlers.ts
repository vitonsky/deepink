import { WorkspaceEvents } from '@api/events/workspace';
import { formatNoteLink } from '@core/features/links';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import {
	useEventBus,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useAppSelector } from '@state/redux/hooks';
import { useVaultSelector, useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspace } from '@state/redux/profiles/profiles';
import { selectDeletionConfig } from '@state/redux/profiles/selectors/vault';
import { copyTextToClipboard } from '@utils/clipboard';

import { buildFileName, useNotesExport } from './useNotesExport';

const mdCharsForEscape = ['\\', '[', ']'];
const mdCharsForEscapeRegEx = new RegExp(
	`(${mdCharsForEscape.map((char) => '\\' + char).join('|')})`,
	'g',
);

/**
 * Registers handlers for commands that operate on a specific note
 */
export const useNoteCommandHandlers = () => {
	const telemetry = useTelemetryTracker();
	const notes = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const noteActions = useNoteActions();
	const notesRegistry = useNotesRegistry();

	const notesExport = useNotesExport();
	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const deletionConfig = useVaultSelector(selectDeletionConfig);

	const eventBus = useEventBus();

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.DELETE_NOTE,
		async ({ noteId, permanently }) => {
			const note = await notes.getById(noteId);
			if (!note) return;

			const shouldDeletePermanently =
				deletionConfig.permanentDeletion || permanently || note.isDeleted;

			const confirmMessage = shouldDeletePermanently
				? `Do you want to permanently delete this note?`
				: `Do you want to move this note to the bin?`;

			if (deletionConfig.confirm && !confirm(confirmMessage)) return;

			noteActions.close(noteId);

			if (shouldDeletePermanently) {
				await notes.delete([noteId]);
				await tagsRegistry.setAttachedTags(noteId, []);

				eventBus.emit(WorkspaceEvents.NOTES_UPDATED);
			} else {
				await notes.updateMeta([noteId], { isDeleted: true });

				eventBus.emit(WorkspaceEvents.NOTE_UPDATED, noteId);
			}

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED, { permanently });
		},
	);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN,
		async ({ noteId }) => {
			// only deleted note can be restored
			const note = await notes.getById(noteId);
			if (note && !note.isDeleted) return;

			await notes.updateMeta([noteId], { isDeleted: false });
			eventBus.emit(WorkspaceEvents.NOTE_UPDATED, noteId);

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_RESTORED_FROM_BIN);
		},
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.EXPORT_NOTE, async ({ noteId }) => {
		const note = await notes.getById(noteId);
		await notesExport.exportNote(
			noteId,
			buildFileName(
				workspaceData?.name,
				note?.content.title.trim().slice(0, 50).trim() || `note_${noteId}`,
			),
		);
	});

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK,
		async ({ noteId }) => {
			const note = await notes.getById(noteId);
			if (!note) {
				console.error(`Can't get data of note #${noteId}`);
				return;
			}

			const { title, text } = note.content;
			const noteTitle = (title || text.slice(0, 30))
				.trim()
				.replace(mdCharsForEscapeRegEx, '\\$1');
			const markdownLink = `[${noteTitle}](${formatNoteLink(noteId)})`;

			console.log(`Copy markdown link ${markdownLink}`);

			copyTextToClipboard(markdownLink);
		},
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.DUPLICATE_NOTE, async ({ noteId }) => {
		const sourceNote = await notes.getById(noteId);

		if (!sourceNote) {
			console.warn(`Not found note with id ${sourceNote}`);
			return;
		}

		const { title, text } = sourceNote.content;
		const newNoteId = await notes.add({
			title: 'DUPLICATE: ' + title,
			text,
		});

		const attachedTags = await tagsRegistry.getAttachedTags(noteId);
		const attachedTagsIds = attachedTags.map(({ id }) => id);

		await tagsRegistry.setAttachedTags(newNoteId, attachedTagsIds);

		eventBus.emit(WorkspaceEvents.NOTES_UPDATED);
	});

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE,
		async ({ noteId }) => {
			const note = await notesRegistry.getById(noteId);
			if (!note) {
				console.warn(`Not found note with id ${noteId}`);
				return;
			}

			const newArchivedState = !note.isArchived;
			await notesRegistry.updateMeta([noteId], {
				isArchived: newArchivedState,
			});
			eventBus.emit(WorkspaceEvents.NOTE_UPDATED, noteId);

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_ARCHIVE_TOGGLE, {
				action: newArchivedState ? 'Added' : 'Removed',
			});
		},
	);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.TOGGLE_NOTE_BOOKMARK,
		async ({ noteId }) => {
			const note = await notesRegistry.getById(noteId);
			if (!note) {
				console.warn(`Not found note with id ${noteId}`);
				return;
			}

			const newBookmarkedState = !note.isBookmarked;
			await notesRegistry.updateMeta([noteId], {
				isBookmarked: newBookmarkedState,
			});
			eventBus.emit(WorkspaceEvents.NOTE_UPDATED, noteId);

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_BOOKMARK_TOGGLE, {
				action: newBookmarkedState ? 'Added' : 'Removed',
			});
		},
	);
};
