import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { debounce } from 'lodash';
import remarkGfm from 'remark-gfm';
import { cn } from '@bem-react/classname';

import { INote } from '../../../core/Note';

import { Link } from './components/Link';

import 'github-markdown-css/github-markdown.css';
import './NoteScreen.css';

const cnNoteScreen = cn('NoteScreen');

export type NoteScreenProps = {
	note: INote;
};

export const NoteScreen: FC<NoteScreenProps> = ({ note }) => {
	const currentText = note.data.text;
	const [text, setText] = useState('');

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedSetText = useCallback(debounce((text: string) => {
		setText(text);
	}, 300), []);

	useEffect(() => {
		debouncedSetText(currentText);
	}, [currentText, debouncedSetText]);

	const markdownContent = useMemo(() => {
		return <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
			a: Link
		}}>{text}</ReactMarkdown>;
	}, [text]);

	return <div className={cnNoteScreen()}>
		<div className={cnNoteScreen('Content', ['markdown-body'])}>
			{markdownContent}
		</div>
	</div>;
};
