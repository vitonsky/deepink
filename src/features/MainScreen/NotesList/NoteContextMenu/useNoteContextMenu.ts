import { useCallback, useEffect, useState } from 'react';

import { formatNoteLink } from '@core/features/links';
import { NoteId } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';

import { ContextMenu } from '@electron/requests/contextMenu';
import {
	useNotesRegistry,
	useNotesContext,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { buildFileName, useNotesExport } from '@hooks/notes/useNotesExport';
import { ContextMenuCallback, useContextMenu } from '@hooks/useContextMenu';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspace } from '@state/redux/profiles/profiles';
import { copyTextToClipboard } from '@utils/clipboard';

import { mkdir, writeFile } from 'fs/promises';

import { ContextMenu } from '@electron/requests/contextMenu';
import { useContextMenu } from '@hooks/useContextMenu';

import { defaultNoteMenu } from './noteMenus';
import { useNoteContextMenuCallback } from './useNoteContextMenuCallback';
import { useDynamicContextMenu } from '@hooks/useDynamicContextMenu';
import { NoteActions } from '.';

export type ContextMenuOptions = {
	closeNote: (id: NoteId) => void;
	updateNotes: () => void;
};
import { useCallback } from 'react';
import { INote } from '@core/features/notes';
import { useDynamicContextMenu } from '@hooks/useDynamicContextMenu';

import { defaultNoteMenu, deletedNoteMenu } from './noteMenus';
import {
	ContextMenuOptions,
	useNoteContextMenuCallback,
} from './useNoteContextMenuCallback';

/**
 * Opens the context menu for a note.
 * Automatically selects the appropriate menu based on the notes state
 */
export const useNoteContextMenu = ({
	closeNote,
	updateNotes,
	notesRegistry,
}: DefaultContextMenuOptions) => {
	const telemetry = useTelemetryTracker();

	const notes = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();
	const { noteUpdated: updateNote } = useNotesContext();

	const notesExport = useNotesExport();
	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const noteContextMenuCallback: ContextMenuCallback<NoteActions> = useCallback(
		async ({ id, action }) => {
			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CONTEXT_MENU_CLICK, {
				action,
			});

			switch (action) {
				case NoteActions.DELETE: {
					const targetNote = await notesRegistry.getById(id);
					const isConfirmed = confirm(
						`Are you sure to ${
							targetNote?.isDeleted ? 'permanently delete' : 'delete'
						} note?`,
					);
					if (!isConfirmed) return;

					closeNote(id);

					// permanently delete the note
					if (targetNote?.isDeleted) {
						await notesRegistry.delete([id]);
						await tagsRegistry.setAttachedTags(id, []);
					} else {
						// mark the note as deleted
						await notesRegistry.updateStatus([id], { deleted: true });

						// refresh the note status
						const deletedNote = await notesRegistry.getById(id);
						if (deletedNote) updateNote(deletedNote);
					}

					updateNotes();

					telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED);
					break;
				}
				case NoteActions.RESTORE: {
					const isConfirmed = confirm('Are you sure to restore note?');
					if (!isConfirmed) return;

					await notesRegistry.updateStatus([id], { deleted: false });

					const restoredNote = await notesRegistry.getById(id);
					if (restoredNote) updateNote(restoredNote);

					updateNotes();
					break;
				}
				case NoteActions.DUPLICATE: {
					const sourceNote = await notesRegistry.getById(id);

					if (!sourceNote) {
						console.warn(`Not found note with id ${sourceNote}`);
						return;
					}

					const { title, text } = sourceNote.content;
					const newNoteId = await notesRegistry.add({
						title: 'DUPLICATE: ' + title,
						text,
					});

					const attachedTags = await tagsRegistry.getAttachedTags(id);
					const attachedTagsIds = attachedTags.map(({ id }) => id);

					await tagsRegistry.setAttachedTags(newNoteId, attachedTagsIds);

					updateNotes();
					break;
				}
				case NoteActions.COPY_MARKDOWN_LINK: {
					const note = await notesRegistry.getById(id);
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
					break;
				}
				case NoteActions.EXPORT: {
					const note = await notes.getById(id);
					await notesExport.exportNote(
						id,
						buildFileName(
							workspaceData?.name,
							note?.content.title.trim().slice(0, 50).trim() ||
								`note_${id}`,
						),
					);
					break;
				}
			}
		},
		[
			closeNote,
			notes,
			notesExport,
			updateNote,
			notesRegistry,
			tagsRegistry,
			telemetry,
			updateNotes,
			workspaceData?.name,
		],
	);

export const useNoteContextMenu = ({ closeNote, updateNotes }: ContextMenuOptions) => {
	const noteContextMenuCallback = useNoteContextMenuCallback({
		closeNote,
		updateNotes,
	});
	const openMenu = useDynamicContextMenu(noteContextMenuCallback, defaultNoteMenu);

	return useCallback(
		(note: INote, point: { x: number; y: number }) => {
			const menu = note.isDeleted ? deletedNoteMenu : defaultNoteMenu;

			openMenu(note.id, point, menu);
		},
		[openMenu],
	);
};
