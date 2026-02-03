import React, { FC, useEffect } from 'react';
import { Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Box, HStack, VStack } from '@chakra-ui/react';
import { SyncedPanelGroup } from '@components/SyncedPanelGroup';
import { useTagsRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { NotesListPanel } from '@features/MainScreen/NotesListPanel';
import { WorkspacesPanel } from '@features/MainScreen/WorkspacesPanel';
import { NotesContainer } from '@features/NotesContainer';
import { useWorkspaceShortcutHandlers } from '@hooks/commands/shortcuts/useWorkspaceShortcutHandlers';
import { useNoteCommandHandlers } from '@hooks/notes/useNoteCommandHandlers';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';

import { NotificationsPopup } from '../NotificationsPopup';
import { ActivityBar } from './ActivityBar';
import { NotesViewFilter } from './NotesViewFilter';
import { StatusBar } from './StatusBar';
import { TagsPanel } from './TagsPanel';

export const MainScreen: FC = () => {
	useWorkspaceShortcutHandlers();
	useNoteCommandHandlers();

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
				<Box
					className="invisible-scroll"
					sx={{
						flexShrink: 0,
						height: '100%',
						overflow: 'auto',
						borderRight: '1px solid',
						borderColor: 'surface.border',
						bgColor: 'surface.panel',
					}}
				>
					<ActivityBar />
				</Box>

				<SyncedPanelGroup direction="horizontal" autoSaveId="MainScreen.content">
					<VStack
						as={Panel}
						defaultSize={20}
						sx={{
							alignItems: 'start',

							minWidth: 'min-content',
							maxWidth: '350px',
							padding: '.5rem',
							overflow: 'hidden',
							display: 'flex',
							flexDirection: 'column',
							gap: '1rem',
						}}
					>
						<NotesViewFilter />

						<TagsPanel />

						<WorkspacesPanel marginTop="auto" />
					</VStack>

					<Box as={PanelResizeHandle} color="surface.border" />

					<VStack
						as={Panel}
						defaultSize={20}
						sx={{
							alignItems: 'start',

							minWidth: '200px',
							maxWidth: '350px',
							padding: '.5rem',
							overflow: 'hidden',
							display: 'flex',
							flexDirection: 'column',
							gap: '1rem',
						}}
					>
						<NotesListPanel />
					</VStack>

					<Box as={PanelResizeHandle} color="surface.border" />

					<Box as={Panel} minSize={50}>
						<NotesContainer />
					</Box>
				</SyncedPanelGroup>
			</HStack>

			<StatusBar />

			<NotificationsPopup />
		</VStack>
	);
};
