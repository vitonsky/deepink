import React, { FC } from 'react';
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
		<Box w="100%" className={cnNotes()}>
			{tabs
				.filter((id) => notes.some((note) => note.id === id))
				.map((id) => {
					const note = notes.find((note) => note.id === id) as INote;
					const isActiveTab = activeTab === note.id;
					return (
						<Box
							key={note.id}
							display={isActiveTab ? 'flex' : 'none'}
							w="100%"
							h="100%"
						>
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
						</Box>
					);
				})}
		</Box>
	);
};
