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
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspace } from '@state/redux/profiles/profiles';
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

/**
 * Returns a callback to handle note context menu actions
 */
export const useNoteContextMenuCallback = ({
	closeNote,
	updateNotes,
}: ContextMenuOptions) => {
	const notes = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const notesExport = useNotesExport();
	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const eventBus = useEventBus();

	return useCallback<ContextMenuCallback<NoteActions>>(
		async ({ id, action }) => {
			const actionsMap = {
				[NoteActions.DELETE]: async (id: string) => {
					const targetNote = await notes.getById(id);
					if (!targetNote) return;
					const isConfirmed = confirm(
						`Are you sure you want to ${
							targetNote.isDeleted
								? 'delete the note permanently'
								: 'move the note to the bin'
						}?`,
					);
					if (!isConfirmed) return;

					closeNote(id);

					if (targetNote.isDeleted) {
						await notes.delete([id]);
						await tagsRegistry.setAttachedTags(id, []);
					} else {
						await notes.updateMeta([id], { isDeleted: true });
						eventBus.emit(WorkspaceEvents.NOTE_UPDATED, id);
					}

					updateNotes();
				},

				[NoteActions.RESTORE]: async (id: string) => {
					const isConfirmed = confirm(
						'Are you sure you want to restore the note',
					);
					if (!isConfirmed) return;

					await notes.updateMeta([id], { isDeleted: false });
					eventBus.emit(WorkspaceEvents.NOTE_UPDATED, id);

					updateNotes();
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
			closeNote,
			eventBus,
			notesExport,
			notes,
			tagsRegistry,
			updateNotes,
			workspaceData?.name,
		],
	);
};
