import React, { FC, useEffect } from 'react';
import { HStack, VStack } from '@chakra-ui/react';
import { useTagsRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { NotesPanel } from '@features/MainScreen/NotesPanel';
import { WorkspaceBar } from '@features/MainScreen/WorkspaceBar';
import { NotesContainer } from '@features/NotesContainer';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';

import { useCommandSubscription, useHotkeyBindings } from '../App/hotkey/commandHooks';
import { ProfileSettings } from '../ProfileSettings/ProfileSettings';
import { NewNoteButton } from './NewNoteButton';
import { NotesOverview } from './NotesOverview';
import { NotificationsPopup } from './NotificationsPopup/NotificationsPopup';
import { StatusBar } from './StatusBar';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveNoteId,
	selectRecentlyClosedNote,
} from '@state/redux/profiles/profiles';
import { useCreateNote } from '@hooks/notes/useCreateNote';

export const MainScreen: FC = () => {
	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);

	const tagsRegistry = useTagsRegistry();
	const updateNotes = useUpdateNotes();

	// Init notes list
	useEffect(() => {
		updateNotes();
	}, [updateNotes]);

	// Update notes list by attach tags
	useEffect(() => {
		return tagsRegistry.onChange((scope) => {
			if (scope === 'noteTags') {
				updateNotes();
			}
		});
	}, [tagsRegistry, updateNotes]);
	const createNote = useCreateNote();

	useHotkeyBindings();
	useCommandSubscription('createNote', createNote);

	return (
		<VStack gap={0} w="100%" h="100%">
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
					<NewNoteButton />

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
