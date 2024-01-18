import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Select } from 'react-elegant-ui/esm/components/Select/Select.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import {
	FaArrowDownWideShort,
	FaGear,
	FaMagnifyingGlass,
	FaPenToSquare,
} from 'react-icons/fa6';
import { useStore, useStoreMap } from 'effector-react';
import { cn } from '@bem-react/classname';

import { INote, NoteId } from '../../../core/Note';
import {
	$activeNoteId,
	$openedNotes,
	activeNoteChanged,
	openedNotesControls,
} from '../../../core/state/notes';
import { $activeTag, $tags, tagAttachmentsChanged } from '../../../core/state/tags';
import { Icon } from '../../components/Icon/Icon.bundle/common';
import { Stack } from '../../components/Stack/Stack';

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
	const activeNoteId = useStore($activeNoteId);
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

			activeNoteChanged(id);
		},
		[notes],
	);

	const openedNotes = useStore($openedNotes);
	const tabs = useStoreMap($openedNotes, (state) => state.map(({ id }) => id));
	const onNoteClose = useCallback(
		(id: NoteId) => {
			const tabIndex = openedNotes.findIndex((note) => note.id === id);

			// Change tab if it is current tab
			if (id === activeNoteId) {
				let nextTab = null;
				if (tabIndex > 0) {
					nextTab = openedNotes[tabIndex - 1].id;
				} else if (tabIndex === 0 && openedNotes.length > 1) {
					nextTab = openedNotes[1].id;
				}
				activeNoteChanged(nextTab);
			}

			openedNotesControls.delete(id);
		},
		[openedNotes, activeNoteId],
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
				<div className={cnMainScreen('SideBar', { view: 'main' })}>
					<Button
						className={cnMainScreen('NewNoteButton')}
						view="action"
						onPress={createNote}
						iconLeft={() => (
							<Icon boxSize="1rem" hasGlyph>
								<FaPenToSquare size="100%" />
							</Icon>
						)}
					>
						New note
					</Button>

					<NotesOverview />

					<div className={cnMainScreen('Workspace')}>
						<Select
							className={cnMainScreen('WorkspacePicker')}
							options={[
								{
									id: 'default',
									content: 'Default',
								},
							]}
							value="default"
						></Select>
						<Button title="Workspace settings">
							<Icon boxSize="1rem" hasGlyph>
								<FaGear size="100%" />
							</Icon>
						</Button>
					</div>
				</div>

				<div className={cnMainScreen('SideBar')}>
					<Stack direction="horizontal" spacing={1}>
						<Textinput
							placeholder="Search..."
							size="s"
							addonBeforeControl={
								<Icon
									boxSize="1rem"
									hasGlyph
									style={{
										zIndex: 2,
										marginInlineStart: '.5rem',
										marginInlineEnd: '.3rem',
										opacity: 0.7,
									}}
								>
									<FaMagnifyingGlass size="100%" />
								</Icon>
							}
						/>

						<Button view="default">
							<Icon boxSize="1rem" hasGlyph>
								<FaArrowDownWideShort size="100%" />
							</Icon>
						</Button>
					</Stack>

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
								activeNote: activeNoteId,
							}}
						/>
					</div>
				</div>
				<Stack
					direction="vertical"
					spacing={2}
					className={cnMainScreen('ContentBlock')}
				>
					<TopBar
						{...{
							notesRegistry,
							updateNotes,
							notes: openedNotes,
							tabs,
							activeTab: activeNoteId ?? null,
							onClose: onNoteClose,
							onPick: onNoteClick,
						}}
					/>
					<div className={cnMainScreen('NoteEditors')}>
						<Notes
							{...{
								notes: openedNotes,
								tabs,
								activeTab: activeNoteId ?? null,
								updateNote,
							}}
						/>
					</div>
				</Stack>
			</div>

			<StatusBar notesRegistry={notesRegistry} updateNotes={updateNotes} />
		</div>
	);
};
