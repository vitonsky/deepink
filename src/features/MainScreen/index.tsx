import React, { FC, useCallback, useEffect, useRef } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import {
	FaArrowsRotate,
	FaClockRotateLeft,
	FaLock,
	FaPenToSquare,
	FaUserLarge,
} from 'react-icons/fa6';
import { useStoreMap } from 'effector-react';
import { cn } from '@bem-react/classname';
import { useFirstRender } from '@components/hooks/useFirstRender';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { NoteId } from '@core/features/notes';
import { NotesPanel } from '@features/MainScreen/NotesPanel';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { WorkspaceBar } from '@features/MainScreen/WorkspaceBar';
import { NotesContainer } from '@features/NotesContainer';
import { useProfileControls } from '@features/Profile';
import {
	useNotesContext,
	useNotesRegistry,
	useTagsContext,
	useTagsRegistry,
	useWorkspaceContext,
} from '@features/Workspace/WorkspaceProvider';

import { useNoteActions } from '../../hooks/notes/useNoteActions';
import { useUpdateNotes } from '../../hooks/notes/useUpdateNotes';

import { Preferences } from '../Preferences/Preferences';
import { NotesOverview } from './NotesOverview';
import { Notifications } from './Notifications/Notifications';
import { StatusBar } from './StatusBar';

import './MainScreen.css';

export const cnMainScreen = cn('MainScreen');

export const MainScreen: FC = () => {
	const notesRegistry = useNotesRegistry();
	const activeNotesContext = useNotesContext();

	const { events: workspaceEvents } = useWorkspaceContext();

	const activeNoteId = useStoreMap(
		activeNotesContext.$notes,
		({ activeNote }) => activeNote,
	);

	const notes = useStoreMap(activeNotesContext.$notes, ({ notes }) => notes);

	const { $tags } = useTagsContext();
	const activeTag = useStoreMap($tags, ({ selected }) => selected);

	const updateNotes = useUpdateNotes();

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

	const noteActions = useNoteActions();

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
			noteActions.click(newNoteId);
		}
	}, [notes, noteActions.click]);

	const statusBarButtons = useStatusBarManager();

	// Profile controls on status bar
	const profileControls = useProfileControls();
	useFirstRender(() => {
		statusBarButtons.controls.register(
			'dbChange',
			{
				visible: true,
				title: 'Change database',
				onClick: () => profileControls.close(),
				icon: <FaUserLarge />,
			},
			{
				placement: 'start',
				priority: 1,
			},
		);
		statusBarButtons.controls.register(
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
		statusBarButtons.controls.register(
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

	// Note items on status bar
	useEffect(() => {
		const note =
			activeNoteId !== null && openedNotes.find((note) => note.id === activeNoteId);
		if (!note) return;

		const noteDate = note.updatedTimestamp
			? new Date(note.updatedTimestamp).toLocaleDateString()
			: null;

		statusBarButtons.controls.register(
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
			statusBarButtons.controls.unregister('noteTime');
		};
	}, [activeNoteId, statusBarButtons.controls, openedNotes]);

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

					<WorkspaceBar />
				</div>

				<div className={cnMainScreen('SideBar')}>
					<NotesPanel />
				</div>

				<NotesContainer />
			</div>

			<StatusBar />

			<Notifications />
			<Preferences />
		</div>
	);
};
