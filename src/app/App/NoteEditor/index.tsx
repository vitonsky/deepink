import { FC, useMemo, useState } from 'react';
import { notes } from '../../../core/Note';
import { MonacoEditor } from '../MonakoEditor/MonacoEditor';
import React from 'react';
import { getNoteTitle } from '..';

// TODO: provide note object instead of id
export const NoteEditor: FC<{ id: number }> = ({ id }) => {
	const note = useMemo(() => notes[id], [id]);

	const [text, setText] = useState(note.text ?? '');

	if (!note) return null;

	return (
		<>
			<h2> {getNoteTitle(note)}</h2>
			<MonacoEditor value={text} setValue={setText} />
		</>
	);
};
