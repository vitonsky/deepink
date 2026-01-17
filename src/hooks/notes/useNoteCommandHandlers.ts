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
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId, selectWorkspace } from '@state/redux/profiles/profiles';
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

	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.DELETE_NOTE_TO_BIN, async (payload) => {
		const id = payload?.id ?? activeNoteId;
		if (!id) return;

		if (requiresConfirmMoveToBin) {
			const isConfirmed = confirm(`Do you want to move this note to the bin?`);
			if (!isConfirmed) return;
		}

		noteActions.close(id);

		await notes.updateMeta([id], { isDeleted: true });
		eventBus.emit(WorkspaceEvents.NOTE_UPDATED, id);

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED, {
			permanently: 'false',
		});
	});

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY,
		async (payload) => {
			const id = payload?.id ?? activeNoteId;
			if (!id) return;

			// Only notes with deleted status can be permanently deleted
			const note = await notes.getById(id);
			if (!note?.isDeleted) return;

			const isConfirmed = confirm(`Do you want to permanently delete this note?`);
			if (!isConfirmed) return;

			noteActions.close(id);

			await notes.delete([id]);
			await tagsRegistry.setAttachedTags(id, []);
			eventBus.emit(WorkspaceEvents.NOTES_UPDATED);

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED, {
				permanently: 'true',
			});
		},
	);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN,
		async (payload) => {
			const id = payload?.id ?? activeNoteId;
			if (!id) return;

			// Only notes with deleted status can be restored
			const note = await notes.getById(id);
			if (!note?.isDeleted) return;

			await notes.updateMeta([id], { isDeleted: false });
			eventBus.emit(WorkspaceEvents.NOTE_UPDATED, id);

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_RESTORED_FROM_BIN);
		},
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.EXPORT_NOTE, async ({ id }) => {
		const note = await notes.getById(id);
		await notesExport.exportNote(
			id,
			buildFileName(
				workspaceData?.name,
				note?.content.title.trim().slice(0, 50).trim() || `note_${id}`,
			),
		);
	});

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK,
		async ({ id }) => {
			const note = await notes.getById(id);
			if (!note) {
				console.error(`Can't get data of note #${id}`);
				return;
			}

			const { title, text } = note.content;
			const noteTitle = (title || text.slice(0, 30))
				.trim()
				.replace(mdCharsForEscapeRegEx, '\\$1');
			const markdownLink = `[${noteTitle}](${formatNoteLink(id)})`;

			console.log(`Copy markdown link ${markdownLink}`);

			copyTextToClipboard(markdownLink);
		},
	);
};
