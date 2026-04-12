import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { INote } from '@core/features/notes';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { ContextMenuCallback } from '@hooks/useContextMenu';
import { useShowNoteContextMenu } from '@hooks/useShowNoteContextMenu';
import { useVaultSelector } from '@state/redux/profiles/hooks';
import { selectDeletionConfig } from '@state/redux/profiles/selectors/vault';

import { NoteActions } from '.';

export const useNoteContextMenu = () => {
	const telemetry = useTelemetryTracker();
	const { t } = useTranslation(LOCALE_NAMESPACE.contextMenu, { keyPrefix: 'note' });

	const deletionConfig = useVaultSelector(selectDeletionConfig);

	const runCommand = useCommand();

	const noteContextMenuCallback = useCallback<ContextMenuCallback<NoteActions>>(
		({ id, action }) => {
			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CONTEXT_MENU_CLICK, {
				action,
			});

			const actionsMap = {
				[NoteActions.DELETE_TO_BIN]: (noteId: string) => {
					runCommand(GLOBAL_COMMANDS.MOVE_NOTE_TO_BIN, {
						noteId,
					});
				},

				[NoteActions.DELETE_PERMANENTLY]: (noteId: string) => {
					runCommand(GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY, {
						noteId,
					});
				},

				[NoteActions.RESTORE_FROM_BIN]: (noteId: string) => {
					runCommand(GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN, { noteId });
				},

				[NoteActions.DUPLICATE]: (noteId: string) => {
					runCommand(GLOBAL_COMMANDS.DUPLICATE_NOTE, { noteId });
				},

				[NoteActions.COPY_MARKDOWN_LINK]: (noteId: string) => {
					runCommand(GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK, { noteId });
				},

				[NoteActions.EXPORT]: (noteId: string) => {
					runCommand(GLOBAL_COMMANDS.EXPORT_NOTE, { noteId });
				},
			};

			if (action in actionsMap) {
				actionsMap[action](id);
			}
		},
		[telemetry, runCommand],
	);

	const showMenu = useShowNoteContextMenu(noteContextMenuCallback);

	return useCallback(
		(note: INote, point: { x: number; y: number }) => {
			showMenu(note.id, point, [
				...(note.isDeleted
					? [{ id: NoteActions.RESTORE_FROM_BIN, label: t('restoreFromBin') }]
					: []),

				...(!note.isDeleted
					? [{ id: NoteActions.DUPLICATE, label: t('duplicate') }]
					: []),

				{
					id: NoteActions.EXPORT,
					label: t('export'),
				},
				{
					id: NoteActions.COPY_MARKDOWN_LINK,
					label: t('copyMarkdownLink'),
				},
				{ type: 'separator' },

				deletionConfig.permanentDeletion || note.isDeleted
					? {
							id: NoteActions.DELETE_PERMANENTLY,
							label: t('deletePermanently'),
						}
					: { id: NoteActions.DELETE_TO_BIN, label: t('deleteToBin') },
			]);
		},
		[deletionConfig.permanentDeletion, showMenu, t],
	);
};
