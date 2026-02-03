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
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspace } from '@state/redux/profiles/profiles';
import { selectConfirmMoveToBin } from '@state/redux/settings/selectors/preferences';
import { copyTextToClipboard } from '@utils/clipboard';

import { buildFileName, useNotesExport } from './useNotesExport';

const mdCharsForEscape = ['\\', '[', ']'];
const mdCharsForEscapeRegEx = new RegExp(
	`(${mdCharsForEscape.map((char) => '\\' + char).join('|')})`,
	'g',
);

/**
 * Handles delete, restore, and export actions for a note
 */
export const useNoteCommandHandlers = () => {
	const telemetry = useTelemetryTracker();
	const notes = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const noteActions = useNoteActions();

	const notesExport = useNotesExport();
	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const requiresConfirmMoveToBin = useAppSelector(selectConfirmMoveToBin);

	const eventBus = useEventBus();

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.DELETE_NOTE,
		async ({ id: noteId, permanent }) => {
			if (permanent) {
				const isConfirmed = confirm(
					`Do you want to permanently delete this note?`,
				);
				if (!isConfirmed) return;

				noteActions.close(noteId);

				await notes.delete([noteId]);
				await tagsRegistry.setAttachedTags(noteId, []);
				eventBus.emit(WorkspaceEvents.NOTES_UPDATED);

				telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED, {
					permanently: 'true',
				});
			}

			if (requiresConfirmMoveToBin) {
				const isConfirmed = confirm(`Do you want to move this note to the bin?`);
				if (!isConfirmed) return;
			}

			noteActions.close(noteId);

			await notes.updateMeta([noteId], { isDeleted: true });
			eventBus.emit(WorkspaceEvents.NOTE_UPDATED, noteId);

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED, {
				permanently: 'false',
			});
		},
	);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN,
		async ({ id: noteId }) => {
			await notes.updateMeta([noteId], { isDeleted: false });
			eventBus.emit(WorkspaceEvents.NOTE_UPDATED, noteId);

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_RESTORED_FROM_BIN);
		},
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.EXPORT_NOTE, async ({ id: noteId }) => {
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
		async ({ id: noteId }) => {
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
};
