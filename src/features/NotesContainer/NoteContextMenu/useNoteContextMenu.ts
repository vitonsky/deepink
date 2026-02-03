import { useCallback } from 'react';
import { INote } from '@core/features/notes';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { ContextMenu } from '@electron/requests/contextMenu';
import {
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { ContextMenuCallback } from '@hooks/useContextMenu';
import { useShowNoteContextMenu } from '@hooks/useShowNoteContextMenu';

import { NoteActions } from '.';
import { useVaultSelector } from '@state/redux/profiles/hooks';
import { selectDeletionConfig } from '@state/redux/profiles/selectors/vault';

export type ContextMenuOptions = {
	updateNotes: () => void;
};

const buildNoteMenu = ({
	note,
	useBin,
}: {
	note: INote;
	useBin: boolean;
}): ContextMenu => {
	return [
		...(note.isDeleted
			? [{ id: NoteActions.RESTORE_FROM_BIN, label: 'Restore' }]
			: []),

		...(!note.isDeleted ? [{ id: NoteActions.DUPLICATE, label: 'Duplicate' }] : []),

		{
			id: NoteActions.EXPORT,
			label: 'Export',
		},
		{
			id: NoteActions.COPY_MARKDOWN_LINK,
			label: 'Copy markdown link',
		},
		{ type: 'separator' },

		!useBin || note.isDeleted
			? { id: NoteActions.DELETE_PERMANENTLY, label: 'Delete permanently' }
			: { id: NoteActions.DELETE_TO_BIN, label: 'Delete to bin' },
	];
};

export const useNoteContextMenu = ({ updateNotes }: ContextMenuOptions) => {
	const telemetry = useTelemetryTracker();

	const notes = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const deletionConfig = useVaultSelector(selectDeletionConfig);

	const runCommand = useCommand();

	const noteContextMenuCallback = useCallback<ContextMenuCallback<NoteActions>>(
		async ({ id, action }) => {
			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CONTEXT_MENU_CLICK, {
				action,
			});

			const actionsMap = {
				[NoteActions.DELETE_TO_BIN]: async (noteId: string) => {
					runCommand(GLOBAL_COMMANDS.DELETE_NOTE, {
						noteId,
						permanently: false,
					});
				},

				[NoteActions.DELETE_PERMANENTLY]: async (noteId: string) => {
					runCommand(GLOBAL_COMMANDS.DELETE_NOTE, {
						noteId,
						permanently: true,
					});
				},

				[NoteActions.RESTORE_FROM_BIN]: async (noteId: string) => {
					runCommand(GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN, { noteId });
				},

				[NoteActions.DUPLICATE]: async (id: string) => {
					const sourceNote = await notes.getById(id);

					if (!sourceNote) {
						console.warn(`Not found note with id ${sourceNote}`);
						return;
					}

					const { title, text } = sourceNote.content;
					const newNoteId = await notes.add({
						title: 'DUPLICATE: ' + title,
						text,
					});

					const attachedTags = await tagsRegistry.getAttachedTags(id);
					const attachedTagsIds = attachedTags.map(({ id }) => id);

					await tagsRegistry.setAttachedTags(newNoteId, attachedTagsIds);

					updateNotes();
				},

				[NoteActions.COPY_MARKDOWN_LINK]: async (noteId: string) => {
					runCommand(GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK, { noteId });
				},

				[NoteActions.EXPORT]: async (noteId: string) => {
					runCommand(GLOBAL_COMMANDS.EXPORT_NOTE, { noteId });
				},
			};

			if (action in actionsMap) {
				actionsMap[action](id);
			}
		},
		[telemetry, runCommand, notes, tagsRegistry, updateNotes],
	);

	const showMenu = useShowNoteContextMenu(noteContextMenuCallback);

	return useCallback(
		(note: INote, point: { x: number; y: number }) => {
			showMenu(
				note.id,
				point,
				buildNoteMenu({ note, useBin: !deletionConfig.permanentDeletion }),
			);
		},
		[deletionConfig.permanentDeletion, showMenu],
	);
};
