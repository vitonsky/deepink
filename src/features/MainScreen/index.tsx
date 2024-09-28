import React, { FC, useEffect } from 'react';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import { FaClockRotateLeft, FaPenToSquare } from 'react-icons/fa6';
import { cn } from '@bem-react/classname';
import { Button, Divider, HStack, Text } from '@chakra-ui/react';
import { useTagsRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { NotesPanel } from '@features/MainScreen/NotesPanel';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { WorkspaceBar } from '@features/MainScreen/WorkspaceBar';
import { NotesContainer } from '@features/NotesContainer';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId, selectOpenedNotes } from '@state/redux/profiles/profiles';

import { useCreateNote } from '../../hooks/notes/useCreateNote';
import { useUpdateNotes } from '../../hooks/notes/useUpdateNotes';

import { Preferences } from '../Preferences/Preferences';
import { NotesOverview } from './NotesOverview';
import { Notifications } from './Notifications/Notifications';
import { StatusBar } from './StatusBar';

import './MainScreen.css';

export const cnMainScreen = cn('MainScreen');

export const MainScreen: FC = () => {
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);

	const tagsRegistry = useTagsRegistry();
	const updateNotes = useUpdateNotes();

	useEffect(() => {
		return tagsRegistry.onChange((scope) => {
			if (scope === 'noteTags') {
				updateNotes();
			}
		});
	}, [tagsRegistry, updateNotes]);

	// Init
	useEffect(() => {
		updateNotes();
	}, [updateNotes]);

	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	const createNote = useCreateNote();

	// Note items on status bar
	const statusBarButtons = useStatusBarManager();
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
					<Button variant="primary" onClick={createNote}>
						<HStack gap="1rem">
							<FaPenToSquare />
							<Text>New note</Text>
						</HStack>
					</Button>

					<Divider />

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
