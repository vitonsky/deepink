import { useCallback } from 'react';
import { formatNoteLink } from '@core/features/links';
import { NoteId } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { selectDirectory } from '@electron/requests/files/renderer';
import {
	useFilesRegistry,
	useNotesContext,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { ContextMenuCallback } from '@hooks/useContextMenu';
import { copyTextToClipboard } from '@utils/clipboard';

import { mkdir, writeFile } from 'fs/promises';
import { NotesExporter } from './NotesExporter';
import { NoteActions } from '.';

export type DefaultContextMenuOptions = {
	closeNote: (id: NoteId) => void;
	updateNotes: () => void;

	// TODO: receive with react context
	notesRegistry: INotesController;
};

const mdCharsForEscape = ['\\', '[', ']'];
export const mdCharsForEscapeRegEx = new RegExp(
	`(${mdCharsForEscape.map((char) => '\\' + char).join('|')})`,
	'g',
);

/**
 * Stores handlers for noteActions
 */
export const useNoteContextMenuCallback = ({
	closeNote,
	updateNotes,
	notesRegistry,
}: DefaultContextMenuOptions) => {
	const filesRegistry = useFilesRegistry();
	const tagsRegistry = useTagsRegistry();
	const { noteUpdated: updateNote } = useNotesContext();

	const noteContextMenuCallback: ContextMenuCallback<NoteActions> = useCallback(
		async ({ id, action }) => {
			const handlers = {
				[NoteActions.DELETE]: async (id: string) => {
					const targetNote = await notesRegistry.getById(id);
					const isConfirmed = confirm(
						`Are you sure to ${
							targetNote?.isDeleted ? 'permanently delete' : 'delete'
						} note?`,
					);
					if (!isConfirmed) return;

					closeNote(id);

					if (targetNote?.isDeleted) {
						await notesRegistry.delete([id]);
						await tagsRegistry.setAttachedTags(id, []);
					} else {
						await notesRegistry.updateStatus([id], { deleted: true });
						const deletedNote = await notesRegistry.getById(id);
						if (deletedNote) updateNote(deletedNote);
					}

					updateNotes();
				},

				[NoteActions.RESTORE]: async (id: string) => {
					const isConfirmed = confirm('Are you sure to restore note?');
					if (!isConfirmed) return;

					await notesRegistry.updateStatus([id], { deleted: false });

					const restoredNote = await notesRegistry.getById(id);
					if (restoredNote) updateNote(restoredNote);

					updateNotes();
				},

				[NoteActions.DUPLICATE]: async (id: string) => {
					const sourceNote = await notesRegistry.getById(id);
					if (!sourceNote) {
						console.warn(`Not found note with id ${id}`);
						return;
					}

					const { title, text } = sourceNote.content;
					const newNoteId = await notesRegistry.add({
						title: 'DUPLICATE: ' + title,
						text,
					});

					const attachedTags = await tagsRegistry.getAttachedTags(id);
					await tagsRegistry.setAttachedTags(
						newNoteId,
						attachedTags.map(({ id }) => id),
					);

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
					if (noteData) {
						await writeFile(`${directory}/${id}.md`, noteData);
					}
				},
			};

			await handlers[action](id);
		},
		[closeNote, filesRegistry, notesRegistry, tagsRegistry, updateNote, updateNotes],
	);

	return noteContextMenuCallback;
};
