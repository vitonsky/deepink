import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import { useStore, useStoreMap } from 'effector-react';
import { cn } from '@bem-react/classname';

import { INote, NoteId } from '../../../core/Note';
import { $openedNotes, openedNotesControls } from '../../../core/state/notes';
import { $activeTag, $tags, tagAttachmentsChanged } from '../../../core/state/tags';

import { useNotesRegistry, useTagsRegistry } from '../Providers';
import { Notes } from './Notes';
import { NotesList } from './NotesList';
import { NotesOverview } from './NotesOverview';
import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';

import './MainScreen.css';

export const cnMainScreen = cn('MainScreen');

export const MainScreen: FC = () => {
	const notesRegistry = useNotesRegistry();
	const [tab, setTab] = useState<NoteId | null>(null);
	const [notes, setNotes] = useState<INote[]>([]);

	const activeTag = useStore($activeTag);
	const updateNotes = useCallback(async () => {
		const tags = activeTag === null ? [] : [activeTag];
		const notes = await notesRegistry.get({ limit: 10000, tags });
		notes.sort((a, b) => {
			const timeA = a.updatedTimestamp ?? a.createdTimestamp ?? 0;
			const timeB = b.updatedTimestamp ?? b.createdTimestamp ?? 0;

			if (timeA > timeB) return -1;
			if (timeB > timeA) return 1;
			return 0;
		});
		setNotes(notes);
	}, [activeTag, notesRegistry]);

	const activeTagName = useStoreMap({
		store: $tags,
		fn(state, [activeTag]) {
			if (activeTag === null) return null;
			return state.find((tag) => tag.id === activeTag)?.name ?? null;
		},
		keys: [activeTag],
	});

	useEffect(() => {
		if (activeTag === null) return;

		return tagAttachmentsChanged.watch((ops) => {
			const isHaveUpdates = ops.some(({ tagId }) => activeTag === tagId);
			if (isHaveUpdates) {
				updateNotes();
			}
		});
	}, [activeTag, updateNotes]);

	// Init
	useEffect(() => {
		updateNotes();
	}, [updateNotes]);

	// TODO: focus on note input
	const onNoteClick = useCallback(
		(id: NoteId) => {
			const note = notes.find((note) => note.id === id);
			if (note) {
				openedNotesControls.add(note);
			}

			setTab(id);
		},
		[notes],
	);

	const openedNotes = useStore($openedNotes);
	const tabs = useStoreMap($openedNotes, (state) => state.map(({ id }) => id));
	const onNoteClose = useCallback(
		(id: NoteId) => {
			const tabIndex = openedNotes.findIndex((note) => note.id === id);

			// Change tab if it is current tab
			if (id === tab) {
				let nextTab = null;
				if (tabIndex > 0) {
					nextTab = openedNotes[tabIndex - 1].id;
				} else if (tabIndex === 0 && openedNotes.length > 1) {
					nextTab = openedNotes[1].id;
				}
				setTab(nextTab);
			}

			openedNotesControls.delete(id);
		},
		[openedNotes, tab],
	);

	// Simulate note update
	const updateNote = useCallback(
		async (note: INote) => {
			openedNotesControls.update(note);
			await notesRegistry.update(note.id, note.data);
			updateNotes();
		},
		[notesRegistry, updateNotes],
	);

	const tagsRegistry = useTagsRegistry();
	const newNoteIdRef = useRef<NoteId | null>(null);
	const createNote = useCallback(async () => {
		const noteId = await notesRegistry.add({ title: '', text: '' });

		if (activeTag) {
			await tagsRegistry.setAttachedTags(noteId, [activeTag]);
			tagAttachmentsChanged([
				{
					tagId: activeTag,
					target: noteId,
					state: 'add',
				},
			]);
		}

		newNoteIdRef.current = noteId;
		updateNotes();
	}, [activeTag, notesRegistry, tagsRegistry, updateNotes]);

	// Focus on new note
	useEffect(() => {
		if (newNoteIdRef.current === null) return;

		const newNoteId = newNoteIdRef.current;
		const isNoteExists = notes.find((note) => note.id === newNoteId);
		if (isNoteExists) {
			newNoteIdRef.current = null;
			onNoteClick(newNoteId);
		}
	}, [notes, onNoteClick]);

	// TODO: add memoizing for tabs mapping
	return (
		<div className={cnMainScreen({}, [cnTheme(theme)])}>
			<div className={cnMainScreen('Content')}>
				<div className={cnMainScreen('SideBar')}>
					<NotesOverview />
				</div>

				<div className={cnMainScreen('SideBar')}>
					<div className={cnMainScreen('SideBarControls')}>
						<Button view="action" onPress={createNote}>
							New note
						</Button>
					</div>

					<div className={cnMainScreen('NotesList')}>
						{activeTagName && (
							<div className={cnMainScreen('NotesListSelectedTag')}>
								With tag{' '}
								<span
									className={cnMainScreen('NotesListSelectedTagName')}
								>
									{activeTagName}
								</span>
							</div>
						)}
						<NotesList
							{...{
								notesRegistry,
								notes,
								updateNotes,
								onPick: onNoteClick,
								onClose: onNoteClose,
								openedNotes: tabs,
								activeNote: tab,
							}}
						/>
					</div>
				</div>
				<div className={cnMainScreen('ContentBlock')}>
					<TopBar
						{...{
							notesRegistry,
							updateNotes,
							notes: openedNotes,
							tabs,
							activeTab: tab ?? null,
							onClose: onNoteClose,
							onPick: onNoteClick,
						}}
					/>
					<div className={cnMainScreen('NoteEditors')}>
						<Notes
							{...{
								notes: openedNotes,
								tabs,
								activeTab: tab ?? null,
								updateNote,
							}}
						/>
					</div>
				</div>
			</div>

			<StatusBar notesRegistry={notesRegistry} updateNotes={updateNotes} />
		</div>
	);
};
