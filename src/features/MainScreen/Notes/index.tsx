import React, { FC, useMemo } from 'react';
import { isEqual } from 'lodash';
import { Box } from '@chakra-ui/react';
import { INote, INoteContent, NoteId } from '@core/features/notes';
import { useAsRef } from '@hooks/useAsRef';

import { useEditorLinks } from '../../MonakoEditor/features/useEditorLinks';
import { Note } from '../../NoteEditor';

export type NotesProps = {
	tabs: NoteId[];
	activeTab: NoteId | null;

	notes: INote[];
	updateNote: (note: INote) => Promise<void>;
};

export const Notes: FC<NotesProps> = ({ notes, tabs, activeTab, updateNote }) => {
	useEditorLinks();

	const notesRef = useAsRef(notes);
	const updateHooks = useMemo(
		() =>
			Object.fromEntries(
				tabs
					.filter((id) => notesRef.current.some((note) => note.id === id))
					.map((id) => {
						return [
							id,
							(content: INoteContent) => {
								const note = notesRef.current.find(
									(note) => note.id === id,
								) as INote;

								// Skip updates with not changed data
								if (isEqual(note.content, content)) {
									return;
								}

								updateNote({ ...note, content });
							},
						];
					}),
			),
		[notesRef, tabs, updateNote],
	);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				flexGrow: '100',
				width: '100%',
			}}
		>
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
							<Note
								key={note.id}
								note={note}
								updateNote={updateHooks[note.id]}
							/>
						</Box>
					);
				})}
		</Box>
	);
};
