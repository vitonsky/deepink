import { useCallback, useEffect, useState } from 'react';
import { formatNoteLink } from '@core/features/links';
import { INote, NoteId } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { ContextMenu } from '@electron/requests/contextMenu';
import { selectDirectory } from '@electron/requests/files/renderer';
import {
	useFilesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { ContextMenuCallback, useContextMenu } from '@hooks/useContextMenu';
import { useAppSelector } from '@state/redux/hooks';
import { selectIsPermanentDeleteNotes } from '@state/redux/settings/settings';
import { copyTextToClipboard } from '@utils/clipboard';

import { mkdir, writeFile } from 'fs/promises';
import { NotesExporter } from './NotesExporter';
import { NoteActions } from '.';

type DefaultContextMenuOptions = {
	closeNote: (id: NoteId) => void;
	updateNotes: () => void;
	noteUpdated: (note: INote) => void;

	// TODO: receive with react context
	notesRegistry: INotesController;
};

export const defaultNoteMenu: ContextMenu = [
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

export const deletedNoteMenu: ContextMenu = [
	{
		id: NoteActions.RESTORE,
		label: 'Restore',
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

export const useNoteContextMenu = ({
	closeNote,
	updateNotes,
	notesRegistry,
	noteUpdated,
}: DefaultContextMenuOptions) => {
	const filesRegistry = useFilesRegistry();
	const tagsRegistry = useTagsRegistry();

	const isPermanentDeleteNotes = useAppSelector(selectIsPermanentDeleteNotes);

	const noteContextMenuCallback: ContextMenuCallback<NoteActions> = useCallback(
		async ({ id, action }) => {
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

					if (isPermanentDeleteNotes || targetNote?.isDeleted) {
						await notesRegistry.delete([id]);
						await tagsRegistry.setAttachedTags(id, []);
					} else {
						await notesRegistry.updateStatus([id], { deleted: true });

						const deletedNote = await notesRegistry.getById(id);
						if (deletedNote) noteUpdated(deletedNote);
					}

					updateNotes();
					break;
				}
				case NoteActions.RESTORE: {
					const isConfirmed = confirm('Are you sure to restore note?');
					if (!isConfirmed) return;

					await notesRegistry.updateStatus([id], { deleted: false });

					const restoredNote = await notesRegistry.getById(id);
					if (restoredNote) noteUpdated(restoredNote);

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
					break;
				}
			}
		},
		[
			closeNote,
			filesRegistry,
			isPermanentDeleteNotes,
			noteUpdated,
			notesRegistry,
			tagsRegistry,
			updateNotes,
		],
	);

	const [activeMenu, setActiveMenu] = useState<ContextMenu>(defaultNoteMenu);
	const triggerContextMenu = useContextMenu(activeMenu, noteContextMenuCallback);

	const [menuTarget, setMenuTarget] = useState<{
		id: string;
		point: { x: number; y: number };
	} | null>(null);

	// define which menu should be open
	const openNoteContextMenu = useCallback(
		async (id: string, point: { x: number; y: number }) => {
			const note = await notesRegistry.getById(id);
			if (!note) return;
			const menu = note.isDeleted ? deletedNoteMenu : defaultNoteMenu;

			setActiveMenu(menu);
			setMenuTarget({ id, point });
		},
		[notesRegistry],
	);

	useEffect(() => {
		if (!menuTarget) return;

		triggerContextMenu(menuTarget.id, menuTarget.point);
		setMenuTarget(null);
	}, [menuTarget, triggerContextMenu]);

	return openNoteContextMenu;
};
