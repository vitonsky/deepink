import React, { FC } from 'react';
import { TabsPanes } from 'react-elegant-ui/esm/components/TabsPanes/TabsPanes.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INote, NoteId } from '../../../../core/Note';
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
		<TabsPanes
			className={cnNotes()}
			renderAll
			activePane={activeTab ?? undefined}
			panes={tabs
				.filter((id) => notes.some((note) => note.id === id))
				.map((id) => {
					const noteObject = notes.find((note) => note.id === id) as INote;
					return {
						id: noteObject.id,
						content: (
							<NoteEditor
								note={noteObject}
								updateNote={(noteData) => {
									updateNote({ ...noteObject, data: noteData });
								}}
							/>
						),
					};
				})}
		/>
	);
};
