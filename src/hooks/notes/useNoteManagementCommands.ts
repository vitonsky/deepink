import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import {
	useNotesContext,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspace } from '@state/redux/profiles/profiles';
import { selectConfirmMoveToBin } from '@state/redux/settings/selectors/preferences';

import { buildFileName, useNotesExport } from './useNotesExport';

/**
 * Handles delete, restore, and export actions for a note
 */
export const useNoteManagementCommands = () => {
	const telemetry = useTelemetryTracker();
	const notes = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const { noteUpdated } = useNotesContext();
	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const notesExport = useNotesExport();
	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const requiresConfirmMoveToBin = useAppSelector(selectConfirmMoveToBin);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.DELETE_NOTE_TO_BIN, async ({ id }) => {
		if (requiresConfirmMoveToBin) {
			const isConfirmed = confirm(`Do you want to move this note to the bin?`);
			if (!isConfirmed) return;
		}

		noteActions.close(id);

		await notes.updateMeta([id], { isDeleted: true });
		const updatedNote = await notes.getById(id);
		if (updatedNote) noteUpdated(updatedNote);

		updateNotes();

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED, {
			permanently: 'false',
		});
	});

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY,
		async ({ id }) => {
			const note = await notes.getById(id);
			if (!note?.isDeleted) return;

			const isConfirmed = confirm(`Do you want to permanently delete this note?`);
			if (!isConfirmed) return;

			noteActions.close(id);

			await notes.delete([id]);
			await tagsRegistry.setAttachedTags(id, []);

			updateNotes();

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED, {
				permanently: 'true',
			});
		},
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN, async ({ id }) => {
		await notes.updateMeta([id], { isDeleted: false });
		const updatedNote = await notes.getById(id);
		if (updatedNote) noteUpdated(updatedNote);

		updateNotes();

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_RESTORED_FROM_BIN);
	});

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
};
