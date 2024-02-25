import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Select } from 'react-elegant-ui/esm/components/Select/Select.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import {
	FaArrowDownWideShort,
	FaArrowsRotate,
	FaClockRotateLeft,
	FaGear,
	FaLock,
	FaMagnifyingGlass,
	FaPenToSquare,
	FaUserLarge,
} from 'react-icons/fa6';
import { useStoreMap } from 'effector-react';
import { useButtonsManager } from '@api/buttons/useButtonsManager';
import { cn } from '@bem-react/classname';
import { useFirstRender } from '@components/hooks/useFirstRender';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { Stack } from '@components/Stack/Stack';
import { INote, NoteId } from '@core/features/notes';
import { useActiveNotesContext } from '@features/App/utils/activeNotes';
import { useProfilesContext } from '@features/App/utils/profiles';
import { useTagsContext } from '@features/App/utils/tags';
import { useWorkspaceContext } from '@features/App/utils/workspace';

import { Preferences } from '../Preferences/Preferences';
import { useNotesRegistry, useTagsRegistry } from '../Providers';
import { WorkspaceSettings } from '../WorkspaceSettings/WorkspaceSettings';
import { Notes } from './Notes';
import { NotesList } from './NotesList';
import { NotesOverview } from './NotesOverview';
import { Notifications } from './Notifications/Notifications';
import { BottomPanelManagerContext, StatusBar, StatusBarContext } from './StatusBar';
import { TopBar } from './TopBar';

import './MainScreen.css';

export const cnMainScreen = cn('MainScreen');

export const MainScreen: FC = () => {
	const notesRegistry = useNotesRegistry();
	const activeNotesContext = useActiveNotesContext();
	const { events: notesEvents } = activeNotesContext;

	const { events: workspaceEvents } = useWorkspaceContext();

	const activeNoteId = useStoreMap(
		activeNotesContext.$notes,
		({ activeNote }) => activeNote,
	);

	const [notes, setNotes] = useState<INote[]>([]);

	const { $tags } = useTagsContext();
	const activeTag = useStoreMap($tags, ({ selected }) => selected);

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

	const activeTagName = useStoreMap($tags, ({ selected, list }) => {
		if (selected === null) return null;
		return list.find((tag) => tag.id === selected)?.name ?? null;
	});

	useEffect(() => {
		if (activeTag === null) return;

		return workspaceEvents.tagAttachmentsChanged.watch((ops) => {
			const isHaveUpdates = ops.some(({ tagId }) => activeTag === tagId);
			if (isHaveUpdates) {
				updateNotes();
			}
		});
	}, [activeTag, updateNotes, workspaceEvents.tagAttachmentsChanged]);

	// Init
	useEffect(() => {
		updateNotes();
	}, [updateNotes]);

	const openedNotes = useStoreMap(
		activeNotesContext.$notes,
		({ openedNotes }) => openedNotes,
	);
	const tabs = useStoreMap(activeNotesContext.$notes, ({ openedNotes }) =>
		openedNotes.map((note) => note.id),
	);

	// TODO: focus on note input
	const onNoteClick = useCallback(
		(id: NoteId) => {
			const isNoteOpened = openedNotes.some((note) => note.id === id);
			if (isNoteOpened) {
				notesEvents.activeNoteChanged(id);
			} else {
				const note = notes.find((note) => note.id === id);
				if (note) {
					notesEvents.noteOpened(note);
				}
			}
		},
		[notes, notesEvents, openedNotes],
	);

	const onNoteClose = useCallback(
		(id: NoteId) => {
			notesEvents.noteClosed(id);
		},
		[notesEvents],
	);

	// Simulate note update
	const updateNote = useCallback(
		async (note: INote) => {
			notesEvents.noteUpdated(note);
			await notesRegistry.update(note.id, note.content);
			await updateNotes();
		},
		[notesEvents, notesRegistry, updateNotes],
	);

	const tagsRegistry = useTagsRegistry();
	const newNoteIdRef = useRef<NoteId | null>(null);
	const createNote = useCallback(async () => {
		const noteId = await notesRegistry.add({ title: '', text: '' });

		if (activeTag) {
			await tagsRegistry.setAttachedTags(noteId, [activeTag]);
			workspaceEvents.tagAttachmentsChanged([
				{
					tagId: activeTag,
					target: noteId,
					state: 'add',
				},
			]);
		}

		newNoteIdRef.current = noteId;
		updateNotes();
	}, [activeTag, notesRegistry, tagsRegistry, updateNotes, workspaceEvents]);

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

	const buttonsManager = useButtonsManager();

	const {
		events: { activeProfileCloseRequested },
	} = useProfilesContext();
	useFirstRender(() => {
		buttonsManager.manager.register(
			'dbChange',
			{
				visible: true,
				title: 'Change database',
				onClick: () => activeProfileCloseRequested(),
				icon: <FaUserLarge />,
			},
			{
				placement: 'start',
				priority: 1,
			},
		);
		buttonsManager.manager.register(
			'dbLock',
			{
				visible: true,
				title: 'Lock database',
				icon: <FaLock />,
			},
			{
				placement: 'start',
				priority: 2,
			},
		);
		buttonsManager.manager.register(
			'sync',
			{
				visible: true,
				title: 'Sync changes',
				icon: <FaArrowsRotate />,
			},
			{
				placement: 'start',
				priority: 3,
			},
		);
	});

	useEffect(() => {
		const note =
			activeNoteId !== null && openedNotes.find((note) => note.id === activeNoteId);
		if (!note) return;

		const noteDate = note.updatedTimestamp
			? new Date(note.updatedTimestamp).toLocaleDateString()
			: null;

		buttonsManager.manager.register(
			'noteTime',
			{
				visible: noteDate !== null,
				title: 'History',
				icon: <FaClockRotateLeft />,
				text: noteDate ?? '',
				onClick: () => console.log('TODO: show note history'),
			},
			{
				placement: 'end',
				priority: 1000,
			},
		);

		return () => {
			buttonsManager.manager.unregister('noteTime');
		};
	}, [activeNoteId, buttonsManager.manager, openedNotes]);

	const [isWorkspaceEditing, setIsWorkspaceEditing] = useState(false);
	const editWorkspace = useCallback(() => {
		setIsWorkspaceEditing(true);
	}, []);

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
						<Button title="Workspace settings" onPress={editWorkspace}>
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

			<StatusBarContext.Provider value={buttonsManager.state}>
				<StatusBar notesRegistry={notesRegistry} updateNotes={updateNotes} />
			</StatusBarContext.Provider>

			<BottomPanelManagerContext.Provider value={buttonsManager}>
				<Notifications />
				<Preferences />
			</BottomPanelManagerContext.Provider>

			<WorkspaceSettings
				isVisible={isWorkspaceEditing}
				onClose={() => setIsWorkspaceEditing(false)}
			/>
		</div>
	);
};
