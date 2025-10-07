import { useCallback, useMemo } from 'react';
import { EventBus } from '@api/events/EventBus';
import { WorkspaceEvents, WorkspaceEventsPayloadMap } from '@api/events/workspace';
import { FilesController } from '@core/features/files/FilesController';
import { formatNoteLink } from '@core/features/links';
import { NoteId } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { selectDirectory } from '@electron/requests/files/renderer';
import {
	useEventBus,
	useFilesRegistry,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { ContextMenuCallback } from '@hooks/useContextMenu';
import { copyTextToClipboard } from '@utils/clipboard';

import { mkdir, writeFile } from 'fs/promises';
import { NotesExporter } from './NotesExporter';
import { NoteActions } from '.';

export type ContextMenuOptions = {
	closeNote: (id: NoteId) => void;
	updateNotes: () => void;
};

export type NoteActionsOptions = ContextMenuOptions & {
	filesRegistry: FilesController;
	tagsRegistry: TagsController;
	eventBus: EventBus<WorkspaceEventsPayloadMap>;
	notesRegistry: INotesController;
};

const mdCharsForEscape = ['\\', '[', ']'];
const mdCharsForEscapeRegEx = new RegExp(
	`(${mdCharsForEscape.map((char) => '\\' + char).join('|')})`,
	'g',
);

/**
 * Creates async handlers for all NoteActions
 */
export const createNoteActions = ({
	notesRegistry,
	filesRegistry,
	tagsRegistry,
	closeNote,
	updateNotes,
	eventBus,
}: NoteActionsOptions) => ({
	[NoteActions.DELETE]: async (id: string) => {
		const targetNote = await notesRegistry.getById(id);
		const isConfirmed = confirm(
			`Are you sure you want to ${
				targetNote?.isDeleted
					? 'delete the note permanently'
					: 'move the note to the bin'
			}?`,
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
		const isConfirmed = confirm('Are you sure you want to restore the note');
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

		copyTextToClipboard(markdownLink);
	},

	[NoteActions.EXPORT]: async (id: string) => {
		const directories = await selectDirectory();
		if (!directories || directories.length !== 1) {
			console.log('Must be selected one directory');
			return;
		}

		const directory = directories[0];
		const filesDirectoryName = `_files`;
		const filesDirectory = [directory, filesDirectoryName].join('/');

		// TODO: remove node usages in frontend code
		await mkdir(filesDirectory, { recursive: true });

		const notesExport = new NotesExporter({
			saveFile: async (file, id) => {
				const filename = `${filesDirectory}/${id}-${file.name}`;

				const buffer = await file.arrayBuffer();
				await writeFile(filename, new Uint8Array(buffer));
				return `./${filesDirectoryName}/${id}-${file.name}`;
			},
			notesRegistry,
			filesRegistry,
			tagsRegistry,
		});

		const noteData = await notesExport.exportNote(id);

		if (!noteData) return;

		await writeFile(`${directory}/${id}.md`, noteData);
	},
});

/**
 * Returns a callback that executes handlers for note context menu actions
 */
export const useNoteContextMenuCallback = (options: ContextMenuOptions) => {
	const filesRegistry = useFilesRegistry();
	const tagsRegistry = useTagsRegistry();
	const notesRegistry = useNotesRegistry();
	const eventBus = useEventBus();

	const actions = useMemo(
		() =>
			createNoteActions({
				...options,
				notesRegistry,
				filesRegistry,
				tagsRegistry,
				eventBus,
			}),
		[options, notesRegistry, filesRegistry, tagsRegistry, eventBus],
	);

	return useCallback<ContextMenuCallback<NoteActions>>(
		async ({ id, action }) => {
			const handler = actions[action];
			if (handler) await handler(id);
		},
		[actions],
	);
};
