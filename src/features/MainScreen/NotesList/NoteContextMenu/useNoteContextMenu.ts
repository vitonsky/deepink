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
=======
import { useCallback } from 'react';
import { WorkspaceEvents } from '@api/events/workspace';
import { formatNoteLink } from '@core/features/links';
import { NoteId } from '@core/features/notes';
import {
	useEventBus,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { buildFileName, useNotesExport } from '@hooks/notes/useNotesExport';
import { ContextMenuCallback } from '@hooks/useContextMenu';
import { useDynamicContextMenu } from '@hooks/useDynamicContextMenu';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspace } from '@state/redux/profiles/profiles';
import { copyTextToClipboard } from '@utils/clipboard';

import { defaultNoteMenu } from './noteMenus';
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
>>>>>>> 9bfb14d6 (chore: improve code)

/**
 * Returns function for call context menu
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
	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const notesExport = useNotesExport();
	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const eventBus = useEventBus();

	const noteContextMenuCallback = useCallback<ContextMenuCallback<NoteActions>>(
		async ({ id, action }) => {
			const actionsMap = {
				[NoteActions.DELETE]: async (id: string) => {
					const targetNote = await notesRegistry.getById(id);
					const isConfirmed = confirm(
						targetNote?.isDeleted
							? 'Do you really want to delete this note permanently? This action cant be undone.'
							: 'Do you want to move this note to the bin?',
					);
					if (!isConfirmed) return;

					closeNote(id);

					if (targetNote?.isDeleted) {
						await notesRegistry.delete([id]);
						await tagsRegistry.setAttachedTags(id, []);
					} else {
						await notesRegistry.updateMeta([id], { isDeleted: true });
						eventBus.emit(WorkspaceEvents.NOTE_UPDATED, id);
					}

					updateNotes();
				},

				[NoteActions.RESTORE]: async (id: string) => {
					const isConfirmed = confirm(
						'Are you sure you want to restore the note',
					);
					if (!isConfirmed) return;

					await notesRegistry.updateMeta([id], { isDeleted: false });
					eventBus.emit(WorkspaceEvents.NOTE_UPDATED, id);

					updateNotes();
				},

				[NoteActions.DUPLICATE]: async (id: string) => {
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
				},

				[NoteActions.COPY_MARKDOWN_LINK]: async (id: string) => {
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
				},

				[NoteActions.EXPORT]: async (id: string) => {
					const note = await notesRegistry.getById(id);
					await notesExport.exportNote(
						id,
						true,
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
			closeNote,
			eventBus,
			notesExport,
			notesRegistry,
			tagsRegistry,
			updateNotes,
			workspaceData?.name,
		],
	);

	return useDynamicContextMenu(noteContextMenuCallback, defaultNoteMenu);
};
