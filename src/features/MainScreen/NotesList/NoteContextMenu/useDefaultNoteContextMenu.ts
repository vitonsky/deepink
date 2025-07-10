import { useCallback } from 'react';
import { formatNoteLink } from '@core/features/links';
import { NoteId } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { ContextMenu } from '@electron/requests/contextMenu';
import {
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { buildFileName, useNotesExport } from '@hooks/notes/useNotesExport';
import { ContextMenuCallback, useContextMenu } from '@hooks/useContextMenu';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspace } from '@state/redux/profiles/profiles';
import { copyTextToClipboard } from '@utils/clipboard';

import { NoteActions } from '.';

type DefaultContextMenuOptions = {
	closeNote: (id: NoteId) => void;
	updateNotes: () => void;

	// TODO: receive with react context
	notesRegistry: INotesController;
};

export const noteMenu: ContextMenu = [
	{
		id: NoteActions.DUPLICATE,
		label: 'Duplicate',
	},
	{
		id: NoteActions.COPY_MARKDOWN_LINK,
		label: 'Copy markdown link',
	},
	{
		id: NoteActions.EXPORT,
		label: 'Export',
	},
	{ type: 'separator' },
	{
		id: NoteActions.DELETE,
		label: 'Delete',
	},
];

const mdCharsForEscape = ['\\', '[', ']'];
const mdCharsForEscapeRegEx = new RegExp(
	`(${mdCharsForEscape.map((char) => '\\' + char).join('|')})`,
	'g',
);

export const useDefaultNoteContextMenu = ({
	closeNote,
	updateNotes,
	notesRegistry,
}: DefaultContextMenuOptions) => {
	const telemetry = useTelemetryTracker();

	const notes = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

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
					const isConfirmed = confirm('Are you sure to delete note?');
					if (!isConfirmed) return;

					closeNote(id);

					await tagsRegistry.setAttachedTags(id, []);

					updateNotes();

					telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED);
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
			notesRegistry,
			tagsRegistry,
			telemetry,
			updateNotes,
			workspaceData?.name,
		],
	);

	return useContextMenu(noteMenu, noteContextMenuCallback);
};
