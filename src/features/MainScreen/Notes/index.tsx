import React, { FC } from 'react';
import { TabsPanes } from 'react-elegant-ui/esm/components/TabsPanes/TabsPanes.bundle/desktop';
import { isEqual } from 'lodash';
import { cn } from '@bem-react/classname';
import { Box } from '@chakra-ui/react';
import { INote, NoteId } from '@core/features/notes';

import { useEditorLinks } from '../../MonakoEditor/features/useEditorLinks';
import { NoteEditor } from '../../NoteEditor';

import './Notes.css';

export const cnNotes = cn('Notes');

export type NotesProps = {
	tabs: NoteId[];
	activeTab: NoteId | null;

	notes: INote[];
	updateNote: (note: INote) => Promise<void>;
};

export const Notes: FC<NotesProps> = ({ notes, tabs, activeTab, updateNote }) => {
	useEditorLinks();

	return (
		<Box
			as={TabsPanes}
			w="100%"
			className={cnNotes()}
			renderAll
			activePane={activeTab ?? undefined}
			panes={tabs
				.filter((id) => notes.some((note) => note.id === id))
				.map((id) => {
					const note = notes.find((note) => note.id === id) as INote;
					return {
						id: note.id,
						content: (
							<NoteEditor
								key={note.id}
								note={note}
								updateNote={(content) => {
									// Skip updates with not changed data
									if (isEqual(note.content, content)) {
										return;
									}

									updateNote({ ...note, content });
								}}
							/>
						),
					};
				})}
		/>
	);
};
