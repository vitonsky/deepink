import React, { FC, HTMLProps, useCallback, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Spinner } from 'react-elegant-ui/esm/components/Spinner/Spinner.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INotesRegistry } from '../../../../core/Registry';
import { changedActiveProfile } from '../../../../core/state/profiles';
import { selectDirectory } from '../../../../electron/requests/files/renderer';
import { useFilesRegistry, useTagsRegistry } from '../../Providers';

import { NotesExporter } from '../NotesList/NoteContextMenu/NotesExporter';
import { mkdir, writeFile } from 'fs/promises';
import { useImportNotes } from './buttons/useImportNotes';

import './StatusBar.css';

export const cnStatusBar = cn('StatusBar');

export type StatusBarProps = HTMLProps<HTMLDivElement> & {
	notesRegistry: INotesRegistry;
	updateNotes: () => void;
};

// TODO: make status bar extensible
export const StatusBar: FC<StatusBarProps> = ({
	className,
	notesRegistry,
	updateNotes,
	...props
}) => {
	const importNotes = useImportNotes({ notesRegistry, updateNotes });

	const [isNotesImportInProgress, setIsNotesImportInProgress] = useState(false);
	const onImportNotes = useCallback(() => {
		setIsNotesImportInProgress(true);
		importNotes().finally(() => {
			setIsNotesImportInProgress(false);
		});
	}, [importNotes]);

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

	return (
		<div {...props} className={cnStatusBar({}, [className])}>
			<div className={cnStatusBar('ActionContainer')}>
				<Button
					size="s"
					view="action"
					onPress={onImportNotes}
					disabled={isNotesImportInProgress}
				>
					Import
				</Button>
				<Button size="s" view="action" onPress={onExport}>
					Export
				</Button>
				<Button
					size="s"
					view="default"
					onClick={() => changedActiveProfile(null)}
				>
					Change profile
				</Button>
			</div>
			<div className={cnStatusBar('StatusContainer')}>
				{isNotesImportInProgress && (
					<span className={cnStatusBar('ProgressIndicator')}>
						<span>Importing notes</span>
						<Spinner size="s" progress />
					</span>
				)}
			</div>
		</div>
	);
};
