import React, { FC, useMemo } from 'react';
import { isEqual } from 'lodash';
import { Box } from '@chakra-ui/react';
import { INote, INoteContent, NoteId } from '@core/features/notes';
import { NoteMeta } from '@core/features/notes/controller';
import { useAsRef } from '@hooks/useAsRef';

import { useEditorLinks } from '../MonakoEditor/features/useEditorLinks';
import { Note } from '../NoteEditor';

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
							{
								updateContent: (content: INoteContent) => {
									const note = notesRef.current.find(
										(note) => note.id === id,
									) as INote;

									// Skip updates with not changed data
									if (isEqual(note.content, content)) {
										return;
									}

									updateNote({ ...note, content });
								},
								updateMeta: (meta: Partial<NoteMeta>) => {
									const note = notesRef.current.find(
										(note) => note.id === id,
									) as INote;

									updateNote({ ...note, ...meta });
								},
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
					const isActive = activeTab === note.id;
					const { updateContent, updateMeta } = updateHooks[note.id];

					return (
						<Box
							key={note.id}
							display={isActive ? 'flex' : 'none'}
							w="100%"
							h="100%"
						>
							<Note
								key={note.id}
								note={note}
								updateNote={updateContent}
								updateMeta={updateMeta}
								isActive={isActive}
							/>
						</Box>
					);
				})}
		</Box>
	);
};
