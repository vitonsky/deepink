import React, { FC, useEffect } from 'react';
import { FaClockRotateLeft, FaPenToSquare } from 'react-icons/fa6';
import { Button, HStack, Text, VStack } from '@chakra-ui/react';
import { useTagsRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { NotesPanel } from '@features/MainScreen/NotesPanel';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { WorkspaceBar } from '@features/MainScreen/WorkspaceBar';
import { NotesContainer } from '@features/NotesContainer';
import { useCreateNote } from '@hooks/notes/useCreateNote';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectActiveNoteId, selectOpenedNotes } from '@state/redux/profiles/profiles';

import { ProfileSettings } from '../ProfileSettings/ProfileSettings';
import { NotesOverview } from './NotesOverview';
import { NotificationsPopup } from './NotificationsPopup/NotificationsPopup';
import { StatusBar } from './StatusBar';

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
		<VStack
			gap={0}
			sx={{
				display: 'flex',
				flexDirection: 'column',
				flexGrow: '100',
				width: '100%',
				height: '100vh',
				maxWidth: '100%',
				maxHeight: '100%',
				backgroundColor: 'surface.background',
				color: 'typography.primary',
			}}
		>
			<HStack
				align="start"
				gap={0}
				sx={{
					flexGrow: '100',
					width: '100%',
					height: '100vh',
					maxWidth: '100%',
					maxHeight: '100%',
					overflow: 'hidden',
				}}
			>
				<VStack
					sx={{
						bgColor: 'surface.panel',
						alignItems: 'start',

						width: '100%',
						height: '100%',
						minWidth: '250px',
						maxWidth: '250px',
						padding: '.5rem',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						gap: '1rem',
						borderRight: '1px solid',
						borderColor: 'surface.border',
					}}
				>
					<Button
						variant="primary"
						w="100%"
						flexShrink={0}
						onClick={createNote}
					>
						<HStack gap="1rem">
							<FaPenToSquare />
							<Text>New note</Text>
						</HStack>
					</Button>

					<NotesOverview />

					<WorkspaceBar />
				</VStack>

				<VStack
					sx={{
						alignItems: 'start',

						width: '100%',
						height: '100%',
						minWidth: '250px',
						maxWidth: '250px',
						padding: '.5rem',
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						gap: '1rem',
						borderRight: '1px solid',
						borderColor: 'surface.border',
					}}
				>
					<NotesPanel />
				</VStack>

				<NotesContainer />
			</HStack>

			<StatusBar />

			<NotificationsPopup />
			<ProfileSettings />
		</VStack>
	);
};
