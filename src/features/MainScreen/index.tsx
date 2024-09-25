import React, { FC, useEffect } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import { FaClockRotateLeft, FaPenToSquare } from 'react-icons/fa6';
import { cn } from '@bem-react/classname';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { NotesPanel } from '@features/MainScreen/NotesPanel';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { WorkspaceBar } from '@features/MainScreen/WorkspaceBar';
import { NotesContainer } from '@features/NotesContainer';
import { useTagsRegistry } from '@features/Workspace/WorkspaceProvider';
import { useAppSelector } from '@state/redux/hooks';
import { selectActiveNoteId, selectOpenedNotes } from '@state/redux/workspaces';

import { useCreateNote } from '../../hooks/notes/useCreateNote';
import { useUpdateNotes } from '../../hooks/notes/useUpdateNotes';

import { Preferences } from '../Preferences/Preferences';
import { NotesOverview } from './NotesOverview';
import { Notifications } from './Notifications/Notifications';
import { StatusBar } from './StatusBar';

import './MainScreen.css';

export const cnMainScreen = cn('MainScreen');

export const MainScreen: FC = () => {
	const activeNoteId = useAppSelector(selectActiveNoteId('default'));

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

	const openedNotes = useAppSelector(selectOpenedNotes('default'));

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
