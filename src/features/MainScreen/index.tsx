import React, { FC, useEffect } from 'react';
import { HStack, VStack } from '@chakra-ui/react';
import { useTagsRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { NotesPanel } from '@features/MainScreen/NotesPanel';
import { WorkspaceBar } from '@features/MainScreen/WorkspaceBar';
import { useUpdateBookmarksList } from '@features/NoteEditor/useBookmarks';
import { NotesContainer } from '@features/NotesContainer';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';

import { ProfileSettings } from '../ProfileSettings/ProfileSettings';
import { NewNoteButton } from './NewNoteButton';
import { NotesOverview } from './NotesOverview';
import { NotificationsPopup } from './NotificationsPopup/NotificationsPopup';
import { StatusBar } from './StatusBar';

export const MainScreen: FC = () => {
	const tagsRegistry = useTagsRegistry();
	const updateNotes = useUpdateNotes();
	const updateBookmarksList = useUpdateBookmarksList();

	// Init notes list
	useEffect(() => {
		updateNotes();
		updateBookmarksList();
	}, [updateNotes, updateBookmarksList]);

	// Update notes list by attach tags
	useEffect(() => {
		return tagsRegistry.onChange((scope) => {
			if (scope === 'noteTags') {
				updateNotes();
			}
		});
	}, [tagsRegistry, updateNotes]);

	useEffect(() => {
		// Prevent a KDE/X11 issue where pressing the middle mouse button pastes text
		// from the clipboard into the focused element, even when clicking another element
		const preventTextInsert = (e: MouseEvent) => {
			// 1 is the middle mouse button
			if (e.button !== 1) return;

			const isEditable = e.composedPath().some((element) => {
				if (!(element instanceof HTMLElement)) return false;

				return (
					element.tagName === 'INPUT' ||
					element.tagName === 'TEXTAREA' ||
					element.isContentEditable
				);
			});

			if (!isEditable) {
				e.preventDefault();
			}
		};

		document.addEventListener('mouseup', preventTextInsert);
		return () => document.removeEventListener('mouseup', preventTextInsert);
	}, []);

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
