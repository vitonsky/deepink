import React, { useCallback, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Spinner } from '@components/Spinner';
import { selectDirectory } from '@electron/requests/files/renderer';

import { useFilesRegistry, useNotesRegistry, useTagsRegistry } from '../../../Providers';
import { NotesExporter } from '../../NotesList/NoteContextMenu/NotesExporter';

import { mkdir, writeFile } from 'fs/promises';

export const ExportButton = () => {
	const notesRegistry = useNotesRegistry();
	const filesRegistry = useFilesRegistry();
	const tagsRegistry = useTagsRegistry();
	const onExport = useCallback(async () => {
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

		await notesExport
			.exportNotes()
			.then((notes) =>
				Promise.all(
					notes.map(({ id, data }) => writeFile(`${directory}/${id}.md`, data)),
				),
			);
	}, [filesRegistry, notesRegistry, tagsRegistry]);

	const [isLoading, setIsLoading] = useState(false);
	const exportNotes = useCallback(() => {
		setIsLoading(true);
		onExport().finally(() => setIsLoading(false));
	}, [onExport]);

	return (
		<Button size="s" view="action" onPress={exportNotes}>
			Export {isLoading && <Spinner size="s" progress />}
		</Button>
	);
};
