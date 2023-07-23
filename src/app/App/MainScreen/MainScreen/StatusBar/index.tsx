import React, { FC, HTMLProps, useCallback } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INotesRegistry } from '../../../../../core/Registry';
import { exportNotes } from '../../../../../electron/requests/files/renderer';

import './StatusBar.css';

export const cnStatusBar = cn('StatusBar');

export type StatusBarProps = HTMLProps<HTMLDivElement> & {
	notesRegistry: INotesRegistry;
	updateNotes: () => void;
};

// TODO: make status bar extensible
export const StatusBar: FC<StatusBarProps> = ({ className, notesRegistry, updateNotes, ...props }) => {
	const onImportNotes = useCallback(async () => {
		const files = await exportNotes();

		console.warn('Files', files);

		// TODO: attach tags with full hierarchy
		// TODO: upload files and replace references
		const enc = new TextDecoder("utf-8");
		for (const filename in files) {
			// Skip not markdown files
			const fileExtension = '.md';
			if (!filename.endsWith(fileExtension)) continue;

			const fileBuffer = files[filename];
			const noteText = enc.decode(fileBuffer);
			console.warn({ noteText });

			const noteNameWithExt = filename.split('/').slice(-1)[0];
			const noteName = noteNameWithExt.slice(0, noteNameWithExt.length - fileExtension.length);
			await notesRegistry.add({ text: noteText, title: noteName });

			// TODO: add method to registry, to emit event by updates
			updateNotes();
		}

		updateNotes();
	}, [notesRegistry, updateNotes]);

	return (
		<div {...props} className={cnStatusBar({}, [className])}>
			<Button size="s" view="action" onPress={onImportNotes}>
				Import
			</Button>
		</div>
	);
};
