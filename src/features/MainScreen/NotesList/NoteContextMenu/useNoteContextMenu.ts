import { useCallback } from 'react';
import { formatNoteLink } from '@core/features/links';
import { INote, NoteId } from '@core/features/notes';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { showConfirmDialog } from '@electron/requests/confirm/renderer';
import { ContextMenu } from '@electron/requests/contextMenu';
import {
	useNotesContext,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { buildFileName, useNotesExport } from '@hooks/notes/useNotesExport';
import { ContextMenuCallback } from '@hooks/useContextMenu';
import { useShowNoteContextMenu } from '@hooks/useShowNoteContextMenu';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspace } from '@state/redux/profiles/profiles';
import { selectConfirmMoveToBin } from '@state/redux/settings/selectors/preferences';
import { copyTextToClipboard } from '@utils/clipboard';

import { NoteActions } from '.';

export type ContextMenuOptions = {
	closeNote: (id: NoteId) => void;
	updateNotes: () => void;
};

const mdCharsForEscape = ['\\', '[', ']'];
const mdCharsForEscapeRegEx = new RegExp(
	`(${mdCharsForEscape.map((char) => '\\' + char).join('|')})`,
	'g',
);

const buildNoteMenu = (note: INote): ContextMenu => {
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

		note.isDeleted
			? { id: NoteActions.DELETE_PERMANENTLY, label: 'Delete permanently' }
			: { id: NoteActions.DELETE_TO_BIN, label: 'Delete to bin' },
	];
};

export const useNoteContextMenu = ({ closeNote, updateNotes }: ContextMenuOptions) => {
	const telemetry = useTelemetryTracker();

	const notes = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const notesExport = useNotesExport();
	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const requiresConfirmMoveToBin = useAppSelector(selectConfirmMoveToBin);

	const { noteUpdated } = useNotesContext();

	const noteContextMenuCallback = useCallback<ContextMenuCallback<NoteActions>>(
		async ({ id, action }) => {
			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CONTEXT_MENU_CLICK, {
				action,
			});

			const actionsMap = {
				[NoteActions.DELETE_TO_BIN]: async (id: string) => {
					if (requiresConfirmMoveToBin) {
						const isConfirmed = await showConfirmDialog(
							`Do you want to move this note to the bin?`,
						);
						if (!isConfirmed) return;
					}

					closeNote(id);

					await notes.updateMeta([id], { isDeleted: true });
					const updatedNote = await notes.getById(id);
					if (updatedNote) noteUpdated(updatedNote);

					updateNotes();

					telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED, {
						permanently: 'false',
					});
				},

				[NoteActions.DELETE_PERMANENTLY]: async (id: string) => {
					const isConfirmed = await showConfirmDialog(
						`Do you want to permanently delete this note?`,
					);
					if (!isConfirmed) return;

					closeNote(id);

					await notes.delete([id]);
					await tagsRegistry.setAttachedTags(id, []);

					updateNotes();

					telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED, {
						permanently: 'true',
					});
				},

				[NoteActions.RESTORE_FROM_BIN]: async (id: string) => {
					await notes.updateMeta([id], { isDeleted: false });
					const updatedNote = await notes.getById(id);
					if (updatedNote) noteUpdated(updatedNote);

					updateNotes();

					telemetry.track(TELEMETRY_EVENT_NAME.NOTE_RESTORED_FROM_BIN);
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

				[NoteActions.COPY_MARKDOWN_LINK]: async (id: string) => {
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

				[NoteActions.EXPORT]: async (id: string) => {
					const note = await notes.getById(id);
					await notesExport.exportNote(
						id,
						buildFileName(
							workspaceData?.name,
							note?.content.title.trim().slice(0, 50).trim() ||
								`note_${id}`,
						),
					);
				},
			};

			if (action in actionsMap) {
				actionsMap[action](id);
			}
		},
		[
			requiresConfirmMoveToBin,
			closeNote,
			notes,
			noteUpdated,
			updateNotes,
			tagsRegistry,
			telemetry,
			notesExport,
			workspaceData?.name,
		],
	);

	const showMenu = useShowNoteContextMenu(noteContextMenuCallback);

	return useCallback(
		(note: INote, point: { x: number; y: number }) => {
			showMenu(note.id, point, buildNoteMenu(note));
		},
		[showMenu],
	);
};
